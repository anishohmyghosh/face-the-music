import json, sys, numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, confusion_matrix
W=sys.argv[1]; d=json.load(open(f'{W}/features.json'))
CL=['anger','fear','happiness','neutral','sadness']
KEEP=[i for i,n in enumerate(d['names']) if not n.startswith('eyeLook') and n!='_neutral']
d['names']=[d['names'][i] for i in KEEP]
X=np.array([[r['x'][i] for i in KEEP] for r in d['rows']]); y=np.array([CL.index(r['label']) for r in d['rows']])
print('counts', np.bincount(y))
def mk(): return make_pipeline(StandardScaler(), LogisticRegression(C=0.5, max_iter=3000, class_weight='balanced'))
# A) replicate size experiment
sizes=[10,20,30,40,50]; res={s:[] for s in sizes}
for seed in range(20):
    rng=np.random.default_rng(seed); test=[]; pool={}
    for c in range(5):
        idx=rng.permutation(np.where(y==c)[0]); test+=list(idx[:20]); pool[c]=idx[20:]
    test=np.array(test)
    for s in sizes:
        tr=np.concatenate([pool[c][:s] for c in range(5)])
        m=mk().fit(X[tr],y[tr]); p=m.predict(X[test])
        res[s].append([accuracy_score(y[test],p), precision_score(y[test],p,average='macro',zero_division=0), recall_score(y[test],p,average='macro')])
sizeexp={s:[round(float(v)*100,1) for v in np.mean(res[s],0)] for s in sizes}
print('size exp (acc,prec,rec) mean of 20 splits:', sizeexp)
# B) full
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=0.2,stratify=y,random_state=42)
m=mk().fit(Xtr,ytr); p=m.predict(Xte)
cm=confusion_matrix(yte,p).tolist()
full={'acc':round(accuracy_score(yte,p)*100,1),'macro_f1':round(f1_score(yte,p,average='macro')*100,1),
 'recall':[round(v*100,1) for v in recall_score(yte,p,average=None)],'precision':[round(v*100,1) for v in precision_score(yte,p,average=None,zero_division=0)],
 'cm':cm,'n_train':len(ytr),'n_test':len(yte)}
print('full', full)
m=mk().fit(X,y); sc=m[0]; lr=m[1]
coef=lr.coef_; top={CL[c]:[d['names'][i] for i in np.argsort(-coef[c])[:4]] for c in range(5)}
print('top features', top)
NM=X[y==3].mean(0)
json.dump({'classes':CL,'neutral_mean':[round(float(v),5) for v in NM],'names':d['names'],'mean':[round(v,6) for v in sc.mean_],'scale':[round(v,6) for v in sc.scale_],
 'W':[[round(v,5) for v in row] for row in coef],'b':[round(v,5) for v in lr.intercept_],
 'eval':{'size_experiment':sizeexp,'full':full,'counts':np.bincount(y).tolist(),'top':top}},open(f'{W}/model.json','w'))
