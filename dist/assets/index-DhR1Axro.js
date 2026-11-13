(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function e(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=e(r);fetch(r.href,a)}})();const Yc="187",sm=0,mu=1,rm=2,jr=1,om=2,Yr=3,es=0,zn=1,$n=2,vr=0,to=1,_u=2,gu=3,vu=4,am=5,_r=100,lm=101,cm=102,hm=103,um=104,dm=200,fm=201,pm=202,mm=203,Zd=204,qd=205,_m=206,gm=207,vm=208,xm=209,Mm=210,ym=211,Sm=212,wm=213,bm=214,Yl=0,Kl=1,Jl=2,ao=3,Ql=4,jl=5,tc=6,ec=7,Kc=0,Em=1,Tm=2,Ji=0,$d=1,Yd=2,Kd=3,Jd=4,Qd=5,jd=6,tf=7,ef=300,yr=301,lo=302,fl=303,pl=304,nc=1e3,Yi=1001,ic=1002,rn=1003,Am=1004,ko=1005,On=1006,ml=1007,Ki=1008,Yn=1009,nf=1010,sf=1011,co=1012,Jc=1013,Ci=1014,pi=1015,Li=1016,Qc=1017,jc=1018,Sr=1020,rf=35902,of=35899,af=1021,lf=1022,Ai=1023,vs=1026,fs=1027,th=1028,eh=1029,Os=1030,nh=1031,ih=1033,ga=33776,va=33777,xa=33778,Ma=33779,sc=35840,rc=35841,oc=35842,ac=35843,lc=36196,cc=37492,hc=37496,uc=37488,dc=37489,Ta=37490,fc=37491,pc=37808,mc=37809,_c=37810,gc=37811,vc=37812,xc=37813,Mc=37814,yc=37815,Sc=37816,wc=37817,bc=37818,Ec=37819,Tc=37820,Ac=37821,Rc=36492,Pc=36494,Cc=36495,Lc=36283,Ic=36284,Aa=36285,Dc=36286,Rm=3200,Nc=0,Pm=1,ds="",Cn="srgb",ho="srgb-linear",Ra="linear",De="srgb",_l=7680,Cm=519,Lm=512,Im=513,Dm=514,cf=515,Nm=516,Fm=517,hf=518,uf=519,Um=35044,xu="300 es",mi=2e3,uo=2001;function Om(s){for(let t=s.length-1;t>=0;--t)if(s[t]>=65535)return!0;return!1}function fo(s){return document.createElementNS("http://www.w3.org/1999/xhtml",s)}function zm(){const s=fo("canvas");return s.style.display="block",s}const Mu={};function yu(...s){const t="THREE."+s.shift();console.log(t,...s)}function df(s){const t=s[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=s[1];e&&e.isStackTrace?s[0]+=" "+e.getLocation():s[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return s}function re(...s){s=df(s);const t="THREE."+s.shift();{const e=s[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...s)}}function Te(...s){s=df(s);const t="THREE."+s.shift();{const e=s[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...s)}}function ya(...s){const t=s.join(" ");t in Mu||(Mu[t]=!0,re(...s))}function Bm(s,t,e){return new Promise(function(i,r){function a(){switch(s.clientWaitSync(t,s.SYNC_FLUSH_COMMANDS_BIT,0)){case s.WAIT_FAILED:r();break;case s.TIMEOUT_EXPIRED:setTimeout(a,e);break;default:i()}}setTimeout(a,e)})}const km={[Yl]:Yl,[Jl]:tc,[Ql]:Ql,[ao]:jl,[Kl]:Kl,[tc]:Jl,[ec]:ec,[jl]:ao};class Hs{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(e)===-1&&i[t].push(e)}hasEventListener(t,e){const i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(e)!==-1}removeEventListener(t,e){const i=this._listeners;if(i===void 0)return;const r=i[t];if(r!==void 0){const a=r.indexOf(e);a!==-1&&r.splice(a,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const i=e[t.type];if(i!==void 0){t.target=this;const r=i.slice(0);for(let a=0,l=r.length;a<l;a++)r[a].call(this,t);t.target=null}}}const An=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Su=1234567;const eo=Math.PI/180,po=180/Math.PI;function Tr(){const s=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(An[s&255]+An[s>>8&255]+An[s>>16&255]+An[s>>24&255]+"-"+An[t&255]+An[t>>8&255]+"-"+An[t>>16&15|64]+An[t>>24&255]+"-"+An[e&63|128]+An[e>>8&255]+"-"+An[e>>16&255]+An[e>>24&255]+An[i&255]+An[i>>8&255]+An[i>>16&255]+An[i>>24&255]).toLowerCase()}function Me(s,t,e){return Math.max(t,Math.min(e,s))}function sh(s,t){return(s%t+t)%t}function Hm(s,t,e,i,r){return i+(s-t)*(r-i)/(e-t)}function Gm(s,t,e){return s!==t?(e-s)/(t-s):0}function no(s,t,e){return(1-e)*s+e*t}function Vm(s,t,e,i){return no(s,t,1-Math.exp(-e*i))}function Wm(s,t=1){return t-Math.abs(sh(s,t*2)-t)}function Xm(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*(3-2*s))}function Zm(s,t,e){return s<=t?0:s>=e?1:(s=(s-t)/(e-t),s*s*s*(s*(s*6-15)+10))}function qm(s,t){return s+Math.floor(Math.random()*(t-s+1))}function $m(s,t){return s+Math.random()*(t-s)}function Ym(s){return s*(.5-Math.random())}function Km(s){s!==void 0&&(Su=s);let t=Su+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Jm(s){return s*eo}function Qm(s){return s*po}function jm(s){return s>0&&Number.isInteger(s)&&2**Math.round(Math.log2(s))===s}function t_(s){return Math.pow(2,Math.ceil(Math.log(s)/Math.LN2))}function ff(s){return Math.pow(2,Math.floor(Math.log(s)/Math.LN2))}function e_(s,t,e,i,r){const a=Math.cos,l=Math.sin,h=a(e/2),u=l(e/2),d=a((t+i)/2),m=l((t+i)/2),_=a((t-i)/2),p=l((t-i)/2),g=a((i-t)/2),y=l((i-t)/2);switch(r){case"XYX":s.set(h*m,u*_,u*p,h*d);break;case"YZY":s.set(u*p,h*m,u*_,h*d);break;case"ZXZ":s.set(u*_,u*p,h*m,h*d);break;case"XZX":s.set(h*m,u*y,u*g,h*d);break;case"YXY":s.set(u*g,h*m,u*y,h*d);break;case"ZYZ":s.set(u*y,u*g,h*m,h*d);break;default:re("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function rh(s){switch(s.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function pf(s,t){if(t.constructor===Float32Array)return s;const e=rh(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(s/e,-1)}function mf(s,t){if(t.constructor===Float32Array)return s;const e=rh(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(s*e)}const gl={DEG2RAD:eo,RAD2DEG:po,generateUUID:Tr,clamp:Me,euclideanModulo:sh,mapLinear:Hm,inverseLerp:Gm,lerp:no,damp:Vm,pingpong:Wm,smoothstep:Xm,smootherstep:Zm,randInt:qm,randFloat:$m,randFloatSpread:Ym,seededRandom:Km,degToRad:Jm,radToDeg:Qm,isPowerOfTwo:jm,ceilPowerOfTwo:t_,floorPowerOfTwo:ff,setQuaternionFromProperEuler:e_,normalize:mf,denormalize:pf},Th=class Th{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,i=this.y,r=t.elements;return this.x=r[0]*e+r[3]*i+r[6],this.y=r[1]*e+r[4]*i+r[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Me(this.x,t.x,e.x),this.y=Me(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Me(this.x,t,e),this.y=Me(this.y,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Me(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Me(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y;return e*e+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const i=Math.cos(e),r=Math.sin(e),a=this.x-t.x,l=this.y-t.y;return this.x=a*i-l*r+t.x,this.y=a*r+l*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Th.prototype.isVector2=!0;let le=Th;class Kn{constructor(t=0,e=0,i=0,r=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=i,this._w=r}static slerpFlat(t,e,i,r,a,l,h){let u=i[r+0],d=i[r+1],m=i[r+2],_=i[r+3],p=a[l+0],g=a[l+1],y=a[l+2],w=a[l+3];if(_!==w||u!==p||d!==g||m!==y){let M=u*p+d*g+m*y+_*w;M<0&&(p=-p,g=-g,y=-y,w=-w,M=-M);let v=1-h;if(M<.9995){const b=Math.acos(M),I=Math.sin(b);v=Math.sin(v*b)/I,h=Math.sin(h*b)/I,u=u*v+p*h,d=d*v+g*h,m=m*v+y*h,_=_*v+w*h}else{u=u*v+p*h,d=d*v+g*h,m=m*v+y*h,_=_*v+w*h;const b=1/Math.sqrt(u*u+d*d+m*m+_*_);u*=b,d*=b,m*=b,_*=b}}t[e]=u,t[e+1]=d,t[e+2]=m,t[e+3]=_}static multiplyQuaternionsFlat(t,e,i,r,a,l){const h=i[r],u=i[r+1],d=i[r+2],m=i[r+3],_=a[l],p=a[l+1],g=a[l+2],y=a[l+3];return t[e]=h*y+m*_+u*g-d*p,t[e+1]=u*y+m*p+d*_-h*g,t[e+2]=d*y+m*g+h*p-u*_,t[e+3]=m*y-h*_-u*p-d*g,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,i,r){return this._x=t,this._y=e,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const i=t._x,r=t._y,a=t._z,l=t._order,h=Math.cos,u=Math.sin,d=h(i/2),m=h(r/2),_=h(a/2),p=u(i/2),g=u(r/2),y=u(a/2);switch(l){case"XYZ":this._x=p*m*_+d*g*y,this._y=d*g*_-p*m*y,this._z=d*m*y+p*g*_,this._w=d*m*_-p*g*y;break;case"YXZ":this._x=p*m*_+d*g*y,this._y=d*g*_-p*m*y,this._z=d*m*y-p*g*_,this._w=d*m*_+p*g*y;break;case"ZXY":this._x=p*m*_-d*g*y,this._y=d*g*_+p*m*y,this._z=d*m*y+p*g*_,this._w=d*m*_-p*g*y;break;case"ZYX":this._x=p*m*_-d*g*y,this._y=d*g*_+p*m*y,this._z=d*m*y-p*g*_,this._w=d*m*_+p*g*y;break;case"YZX":this._x=p*m*_+d*g*y,this._y=d*g*_+p*m*y,this._z=d*m*y-p*g*_,this._w=d*m*_-p*g*y;break;case"XZY":this._x=p*m*_-d*g*y,this._y=d*g*_-p*m*y,this._z=d*m*y+p*g*_,this._w=d*m*_+p*g*y;break;default:re("Quaternion: .setFromEuler() encountered an unknown order: "+l)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const i=e/2,r=Math.sin(i);return this._x=t.x*r,this._y=t.y*r,this._z=t.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,i=e[0],r=e[4],a=e[8],l=e[1],h=e[5],u=e[9],d=e[2],m=e[6],_=e[10],p=i+h+_;if(p>0){const g=.5/Math.sqrt(p+1);this._w=.25/g,this._x=(m-u)*g,this._y=(a-d)*g,this._z=(l-r)*g}else if(i>h&&i>_){const g=2*Math.sqrt(1+i-h-_);this._w=(m-u)/g,this._x=.25*g,this._y=(r+l)/g,this._z=(a+d)/g}else if(h>_){const g=2*Math.sqrt(1+h-i-_);this._w=(a-d)/g,this._x=(r+l)/g,this._y=.25*g,this._z=(u+m)/g}else{const g=2*Math.sqrt(1+_-i-h);this._w=(l-r)/g,this._x=(a+d)/g,this._y=(u+m)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let i=t.dot(e)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Me(this.dot(t),-1,1)))}rotateTowards(t,e){const i=this.angleTo(t);if(i===0)return this;const r=Math.min(1,e/i);return this.slerp(t,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const i=t._x,r=t._y,a=t._z,l=t._w,h=e._x,u=e._y,d=e._z,m=e._w;return this._x=i*m+l*h+r*d-a*u,this._y=r*m+l*u+a*h-i*d,this._z=a*m+l*d+i*u-r*h,this._w=l*m-i*h-r*u-a*d,this._onChangeCallback(),this}slerp(t,e){let i=t._x,r=t._y,a=t._z,l=t._w,h=this.dot(t);h<0&&(i=-i,r=-r,a=-a,l=-l,h=-h);let u=1-e;if(h<.9995){const d=Math.acos(h),m=Math.sin(d);u=Math.sin(u*d)/m,e=Math.sin(e*d)/m,this._x=this._x*u+i*e,this._y=this._y*u+r*e,this._z=this._z*u+a*e,this._w=this._w*u+l*e,this._onChangeCallback()}else this._x=this._x*u+i*e,this._y=this._y*u+r*e,this._z=this._z*u+a*e,this._w=this._w*u+l*e,this.normalize();return this}slerpQuaternions(t,e,i){return this.copy(t).slerp(e,i)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(r*Math.sin(t),r*Math.cos(t),a*Math.sin(e),a*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Ah=class Ah{constructor(t=0,e=0,i=0){this.x=t,this.y=e,this.z=i}set(t,e,i){return i===void 0&&(i=this.z),this.x=t,this.y=e,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(wu.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(wu.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[3]*i+a[6]*r,this.y=a[1]*e+a[4]*i+a[7]*r,this.z=a[2]*e+a[5]*i+a[8]*r,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=t.elements,l=1/(a[3]*e+a[7]*i+a[11]*r+a[15]);return this.x=(a[0]*e+a[4]*i+a[8]*r+a[12])*l,this.y=(a[1]*e+a[5]*i+a[9]*r+a[13])*l,this.z=(a[2]*e+a[6]*i+a[10]*r+a[14])*l,this}applyQuaternion(t){const e=this.x,i=this.y,r=this.z,a=t.x,l=t.y,h=t.z,u=t.w,d=2*(l*r-h*i),m=2*(h*e-a*r),_=2*(a*i-l*e);return this.x=e+u*d+l*_-h*m,this.y=i+u*m+h*d-a*_,this.z=r+u*_+a*m-l*d,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,i=this.y,r=this.z,a=t.elements;return this.x=a[0]*e+a[4]*i+a[8]*r,this.y=a[1]*e+a[5]*i+a[9]*r,this.z=a[2]*e+a[6]*i+a[10]*r,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Me(this.x,t.x,e.x),this.y=Me(this.y,t.y,e.y),this.z=Me(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Me(this.x,t,e),this.y=Me(this.y,t,e),this.z=Me(this.z,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Me(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const i=t.x,r=t.y,a=t.z,l=e.x,h=e.y,u=e.z;return this.x=r*u-a*h,this.y=a*l-i*u,this.z=i*h-r*l,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const i=t.dot(this)/e;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return vl.copy(this).projectOnVector(t),this.sub(vl)}reflect(t){return this.sub(vl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const i=this.dot(t)/e;return Math.acos(Me(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,i=this.y-t.y,r=this.z-t.z;return e*e+i*i+r*r}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,i){const r=Math.sin(e)*t;return this.x=r*Math.sin(i),this.y=Math.cos(e)*t,this.z=r*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,i){return this.x=t*Math.sin(e),this.y=i,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),r=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=i,this.z=r,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,i=Math.sqrt(1-e*e);return this.x=i*Math.cos(t),this.y=e,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Ah.prototype.isVector3=!0;let nt=Ah;const vl=new nt,wu=new Kn,Rh=class Rh{constructor(t,e,i,r,a,l,h,u,d){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,l,h,u,d)}set(t,e,i,r,a,l,h,u,d){const m=this.elements;return m[0]=t,m[1]=r,m[2]=h,m[3]=e,m[4]=a,m[5]=u,m[6]=i,m[7]=l,m[8]=d,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],this}extractBasis(t,e,i){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,l=i[0],h=i[3],u=i[6],d=i[1],m=i[4],_=i[7],p=i[2],g=i[5],y=i[8],w=r[0],M=r[3],v=r[6],b=r[1],I=r[4],A=r[7],D=r[2],E=r[5],x=r[8];return a[0]=l*w+h*b+u*D,a[3]=l*M+h*I+u*E,a[6]=l*v+h*A+u*x,a[1]=d*w+m*b+_*D,a[4]=d*M+m*I+_*E,a[7]=d*v+m*A+_*x,a[2]=p*w+g*b+y*D,a[5]=p*M+g*I+y*E,a[8]=p*v+g*A+y*x,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],l=t[4],h=t[5],u=t[6],d=t[7],m=t[8];return e*l*m-e*h*d-i*a*m+i*h*u+r*a*d-r*l*u}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],l=t[4],h=t[5],u=t[6],d=t[7],m=t[8],_=m*l-h*d,p=h*u-m*a,g=d*a-l*u,y=e*_+i*p+r*g;if(y===0)return this.set(0,0,0,0,0,0,0,0,0);const w=1/y;return t[0]=_*w,t[1]=(r*d-m*i)*w,t[2]=(h*i-r*l)*w,t[3]=p*w,t[4]=(m*e-r*u)*w,t[5]=(r*a-h*e)*w,t[6]=g*w,t[7]=(i*u-d*e)*w,t[8]=(l*e-i*a)*w,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,i,r,a,l,h){const u=Math.cos(a),d=Math.sin(a);return this.set(i*u,i*d,-i*(u*l+d*h)+l+t,-r*d,r*u,-r*(-d*l+u*h)+h+e,0,0,1),this}scale(t,e){return ya("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(xl.makeScale(t,e)),this}rotate(t){return ya("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(xl.makeRotation(-t)),this}translate(t,e){return ya("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(xl.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,i,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<9;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<9;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Rh.prototype.isMatrix3=!0;let oe=Rh;const xl=new oe,bu=new oe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Eu=new oe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function n_(){const s={enabled:!0,workingColorSpace:ho,spaces:{},convert:function(r,a,l){return this.enabled===!1||a===l||!a||!l||(this.spaces[a].transfer===De&&(r.r=Qi(r.r),r.g=Qi(r.g),r.b=Qi(r.b)),this.spaces[a].primaries!==this.spaces[l].primaries&&(r.applyMatrix3(this.spaces[a].toXYZ),r.applyMatrix3(this.spaces[l].fromXYZ)),this.spaces[l].transfer===De&&(r.r=xr(r.r),r.g=xr(r.g),r.b=xr(r.b))),r},workingToColorSpace:function(r,a){return this.convert(r,this.workingColorSpace,a)},colorSpaceToWorking:function(r,a){return this.convert(r,a,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===ds?Ra:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,a=this.workingColorSpace){return r.fromArray(this.spaces[a].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,a,l){return r.copy(this.spaces[l].fromXYZ).multiply(this.spaces[a].toXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],i=[.3127,.329];return s.define({[ho]:{primaries:t,whitePoint:i,transfer:Ra,toXYZ:bu,fromXYZ:Eu,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Cn},outputColorSpaceConfig:{drawingBufferColorSpace:Cn}},[Cn]:{primaries:t,whitePoint:i,transfer:De,toXYZ:bu,fromXYZ:Eu,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Cn}}}),s}const xe=n_();function Qi(s){return s<.04045?s*.0773993808:Math.pow(s*.9478672986+.0521327014,2.4)}function xr(s){return s<.0031308?s*12.92:1.055*Math.pow(s,.41666)-.055}let er;class i_{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{er===void 0&&(er=fo("canvas")),er.width=t.width,er.height=t.height;const r=er.getContext("2d");t instanceof ImageData?r.putImageData(t,0,0):r.drawImage(t,0,0,t.width,t.height),i=er}return i.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=fo("canvas");e.width=t.width,e.height=t.height;const i=e.getContext("2d");i.drawImage(t,0,0,t.width,t.height);const r=i.getImageData(0,0,t.width,t.height),a=r.data;for(let l=0;l<a.length;l++)a[l]=Qi(a[l]/255)*255;return i.putImageData(r,0,0),e}else if(t.data){const e=t.data.slice(0);for(let i=0;i<e.length;i++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[i]=Math.floor(Qi(e[i]/255)*255):e[i]=Qi(e[i]);return{data:e,width:t.width,height:t.height}}else return re("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let s_=0;class oh{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:s_++}),this.uuid=Tr(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let a;if(Array.isArray(r)){a=[];for(let l=0,h=r.length;l<h;l++)r[l].isDataTexture?a.push(Ml(r[l].image)):a.push(Ml(r[l]))}else a=Ml(r);i.url=a}return e||(t.images[this.uuid]=i),i}}function Ml(s){return typeof HTMLImageElement<"u"&&s instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&s instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&s instanceof ImageBitmap?i_.getDataURL(s):s.data?{data:Array.from(s.data),width:s.width,height:s.height,type:s.data.constructor.name}:(re("Texture: Unable to serialize Texture."),{})}let r_=0;const yl=new nt;class En extends Hs{constructor(t=En.DEFAULT_IMAGE,e=En.DEFAULT_MAPPING,i=Yi,r=Yi,a=On,l=Ki,h=Ai,u=Yn,d=En.DEFAULT_ANISOTROPY,m=ds){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:r_++}),this.uuid=Tr(),this.name="",this.source=new oh(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=a,this.minFilter=l,this.anisotropy=d,this.format=h,this.internalFormat=null,this.type=u,this.offset=new le(0,0),this.repeat=new le(1,1),this.center=new le(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new oe,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=m,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(yl).x}get height(){return this.source.getSize(yl).y}get depth(){return this.source.getSize(yl).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const i=t[e];if(i===void 0){re(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){re(`Texture.setValues(): property '${e}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),e||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==ef)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case nc:t.x=t.x-Math.floor(t.x);break;case Yi:t.x=t.x<0?0:1;break;case ic:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case nc:t.y=t.y-Math.floor(t.y);break;case Yi:t.y=t.y<0?0:1;break;case ic:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}En.DEFAULT_IMAGE=null;En.DEFAULT_MAPPING=ef;En.DEFAULT_ANISOTROPY=1;const Ph=class Ph{constructor(t=0,e=0,i=0,r=1){this.x=t,this.y=e,this.z=i,this.w=r}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,i,r){return this.x=t,this.y=e,this.z=i,this.w=r,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,i=this.y,r=this.z,a=this.w,l=t.elements;return this.x=l[0]*e+l[4]*i+l[8]*r+l[12]*a,this.y=l[1]*e+l[5]*i+l[9]*r+l[13]*a,this.z=l[2]*e+l[6]*i+l[10]*r+l[14]*a,this.w=l[3]*e+l[7]*i+l[11]*r+l[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,i,r,a;const u=t.elements,d=u[0],m=u[4],_=u[8],p=u[1],g=u[5],y=u[9],w=u[2],M=u[6],v=u[10];if(Math.abs(m-p)<.01&&Math.abs(_-w)<.01&&Math.abs(y-M)<.01){if(Math.abs(m+p)<.1&&Math.abs(_+w)<.1&&Math.abs(y+M)<.1&&Math.abs(d+g+v-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const I=(d+1)/2,A=(g+1)/2,D=(v+1)/2,E=(m+p)/4,x=(_+w)/4,T=(y+M)/4;return I>A&&I>D?I<.01?(i=0,r=.707106781,a=.707106781):(i=Math.sqrt(I),r=E/i,a=x/i):A>D?A<.01?(i=.707106781,r=0,a=.707106781):(r=Math.sqrt(A),i=E/r,a=T/r):D<.01?(i=.707106781,r=.707106781,a=0):(a=Math.sqrt(D),i=x/a,r=T/a),this.set(i,r,a,e),this}let b=Math.sqrt((M-y)*(M-y)+(_-w)*(_-w)+(p-m)*(p-m));return Math.abs(b)<.001&&(b=1),this.x=(M-y)/b,this.y=(_-w)/b,this.z=(p-m)/b,this.w=Math.acos((d+g+v-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Me(this.x,t.x,e.x),this.y=Me(this.y,t.y,e.y),this.z=Me(this.z,t.z,e.z),this.w=Me(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Me(this.x,t,e),this.y=Me(this.y,t,e),this.z=Me(this.z,t,e),this.w=Me(this.w,t,e),this}clampLength(t,e){const i=this.length();return this.divideScalar(i||1).multiplyScalar(Me(i,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,i){return this.x=t.x+(e.x-t.x)*i,this.y=t.y+(e.y-t.y)*i,this.z=t.z+(e.z-t.z)*i,this.w=t.w+(e.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ph.prototype.isVector4=!0;let Ze=Ph;class o_ extends Hs{constructor(t=1,e=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:On,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=i.depth,this.scissor=new Ze(0,0,t,e),this.scissorTest=!1,this.viewport=new Ze(0,0,t,e),this.textures=[];const r=i.count;for(let a=0;a<r;a++)this.textures[a]=new En({width:t,height:e,depth:i.depth}),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:On,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,i=1){if(this.width!==t||this.height!==e||this.depth!==i){this.width=t,this.height=e,this.depth=i;for(let r=0,a=this.textures.length;r<a;r++)this.textures[r].image.width=t,this.textures[r].image.height=e,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,i=t.textures.length;e<i;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const r=Object.assign({},t.textures[e].image);this.textures[e].source=new oh(r)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class vi extends o_{constructor(t=1,e=1,i={}){super(t,e,i),this.isWebGLRenderTarget=!0}}class _f extends En{constructor(t=null,e=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=rn,this.minFilter=rn,this.wrapR=Yi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class a_ extends En{constructor(t=null,e=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:i,depth:r},this.magFilter=rn,this.minFilter=rn,this.wrapR=Yi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}const Oa=class Oa{constructor(t,e,i,r,a,l,h,u,d,m,_,p,g,y,w,M){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,i,r,a,l,h,u,d,m,_,p,g,y,w,M)}set(t,e,i,r,a,l,h,u,d,m,_,p,g,y,w,M){const v=this.elements;return v[0]=t,v[4]=e,v[8]=i,v[12]=r,v[1]=a,v[5]=l,v[9]=h,v[13]=u,v[2]=d,v[6]=m,v[10]=_,v[14]=p,v[3]=g,v[7]=y,v[11]=w,v[15]=M,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Oa().fromArray(this.elements)}copy(t){const e=this.elements,i=t.elements;return e[0]=i[0],e[1]=i[1],e[2]=i[2],e[3]=i[3],e[4]=i[4],e[5]=i[5],e[6]=i[6],e[7]=i[7],e[8]=i[8],e[9]=i[9],e[10]=i[10],e[11]=i[11],e[12]=i[12],e[13]=i[13],e[14]=i[14],e[15]=i[15],this}copyPosition(t){const e=this.elements,i=t.elements;return e[12]=i[12],e[13]=i[13],e[14]=i[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,i){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,e,i){return this.set(t.x,e.x,i.x,0,t.y,e.y,i.y,0,t.z,e.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,i=t.elements,r=1/nr.setFromMatrixColumn(t,0).length(),a=1/nr.setFromMatrixColumn(t,1).length(),l=1/nr.setFromMatrixColumn(t,2).length();return e[0]=i[0]*r,e[1]=i[1]*r,e[2]=i[2]*r,e[3]=0,e[4]=i[4]*a,e[5]=i[5]*a,e[6]=i[6]*a,e[7]=0,e[8]=i[8]*l,e[9]=i[9]*l,e[10]=i[10]*l,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,i=t.x,r=t.y,a=t.z,l=Math.cos(i),h=Math.sin(i),u=Math.cos(r),d=Math.sin(r),m=Math.cos(a),_=Math.sin(a);if(t.order==="XYZ"){const p=l*m,g=l*_,y=h*m,w=h*_;e[0]=u*m,e[4]=-u*_,e[8]=d,e[1]=g+y*d,e[5]=p-w*d,e[9]=-h*u,e[2]=w-p*d,e[6]=y+g*d,e[10]=l*u}else if(t.order==="YXZ"){const p=u*m,g=u*_,y=d*m,w=d*_;e[0]=p+w*h,e[4]=y*h-g,e[8]=l*d,e[1]=l*_,e[5]=l*m,e[9]=-h,e[2]=g*h-y,e[6]=w+p*h,e[10]=l*u}else if(t.order==="ZXY"){const p=u*m,g=u*_,y=d*m,w=d*_;e[0]=p-w*h,e[4]=-l*_,e[8]=y+g*h,e[1]=g+y*h,e[5]=l*m,e[9]=w-p*h,e[2]=-l*d,e[6]=h,e[10]=l*u}else if(t.order==="ZYX"){const p=l*m,g=l*_,y=h*m,w=h*_;e[0]=u*m,e[4]=y*d-g,e[8]=p*d+w,e[1]=u*_,e[5]=w*d+p,e[9]=g*d-y,e[2]=-d,e[6]=h*u,e[10]=l*u}else if(t.order==="YZX"){const p=l*u,g=l*d,y=h*u,w=h*d;e[0]=u*m,e[4]=w-p*_,e[8]=y*_+g,e[1]=_,e[5]=l*m,e[9]=-h*m,e[2]=-d*m,e[6]=g*_+y,e[10]=p-w*_}else if(t.order==="XZY"){const p=l*u,g=l*d,y=h*u,w=h*d;e[0]=u*m,e[4]=-_,e[8]=d*m,e[1]=p*_+w,e[5]=l*m,e[9]=g*_-y,e[2]=y*_-g,e[6]=h*m,e[10]=w*_+p}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(l_,t,c_)}lookAt(t,e,i){const r=this.elements;return Wn.subVectors(t,e),Wn.lengthSq()===0&&(Wn.z=1),Wn.normalize(),rs.crossVectors(i,Wn),rs.lengthSq()===0&&(Math.abs(i.z)===1?Wn.x+=1e-4:Wn.z+=1e-4,Wn.normalize(),rs.crossVectors(i,Wn)),rs.normalize(),Ho.crossVectors(Wn,rs),r[0]=rs.x,r[4]=Ho.x,r[8]=Wn.x,r[1]=rs.y,r[5]=Ho.y,r[9]=Wn.y,r[2]=rs.z,r[6]=Ho.z,r[10]=Wn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const i=t.elements,r=e.elements,a=this.elements,l=i[0],h=i[4],u=i[8],d=i[12],m=i[1],_=i[5],p=i[9],g=i[13],y=i[2],w=i[6],M=i[10],v=i[14],b=i[3],I=i[7],A=i[11],D=i[15],E=r[0],x=r[4],T=r[8],H=r[12],F=r[1],k=r[5],G=r[9],W=r[13],z=r[2],j=r[6],rt=r[10],$=r[14],st=r[3],tt=r[7],Y=r[11],lt=r[15];return a[0]=l*E+h*F+u*z+d*st,a[4]=l*x+h*k+u*j+d*tt,a[8]=l*T+h*G+u*rt+d*Y,a[12]=l*H+h*W+u*$+d*lt,a[1]=m*E+_*F+p*z+g*st,a[5]=m*x+_*k+p*j+g*tt,a[9]=m*T+_*G+p*rt+g*Y,a[13]=m*H+_*W+p*$+g*lt,a[2]=y*E+w*F+M*z+v*st,a[6]=y*x+w*k+M*j+v*tt,a[10]=y*T+w*G+M*rt+v*Y,a[14]=y*H+w*W+M*$+v*lt,a[3]=b*E+I*F+A*z+D*st,a[7]=b*x+I*k+A*j+D*tt,a[11]=b*T+I*G+A*rt+D*Y,a[15]=b*H+I*W+A*$+D*lt,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],i=t[4],r=t[8],a=t[12],l=t[1],h=t[5],u=t[9],d=t[13],m=t[2],_=t[6],p=t[10],g=t[14],y=t[3],w=t[7],M=t[11],v=t[15],b=u*g-d*p,I=h*g-d*_,A=h*p-u*_,D=l*g-d*m,E=l*p-u*m,x=l*_-h*m;return e*(w*b-M*I+v*A)-i*(y*b-M*D+v*E)+r*(y*I-w*D+v*x)-a*(y*A-w*E+M*x)}determinantAffine(){const t=this.elements,e=t[0],i=t[4],r=t[8],a=t[1],l=t[5],h=t[9],u=t[2],d=t[6],m=t[10];return e*(l*m-h*d)-i*(a*m-h*u)+r*(a*d-l*u)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,i){const r=this.elements;return t.isVector3?(r[12]=t.x,r[13]=t.y,r[14]=t.z):(r[12]=t,r[13]=e,r[14]=i),this}invert(){const t=this.elements,e=t[0],i=t[1],r=t[2],a=t[3],l=t[4],h=t[5],u=t[6],d=t[7],m=t[8],_=t[9],p=t[10],g=t[11],y=t[12],w=t[13],M=t[14],v=t[15],b=e*h-i*l,I=e*u-r*l,A=e*d-a*l,D=i*u-r*h,E=i*d-a*h,x=r*d-a*u,T=m*w-_*y,H=m*M-p*y,F=m*v-g*y,k=_*M-p*w,G=_*v-g*w,W=p*v-g*M,z=b*W-I*G+A*k+D*F-E*H+x*T;if(z===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const j=1/z;return t[0]=(h*W-u*G+d*k)*j,t[1]=(r*G-i*W-a*k)*j,t[2]=(w*x-M*E+v*D)*j,t[3]=(p*E-_*x-g*D)*j,t[4]=(u*F-l*W-d*H)*j,t[5]=(e*W-r*F+a*H)*j,t[6]=(M*A-y*x-v*I)*j,t[7]=(m*x-p*A+g*I)*j,t[8]=(l*G-h*F+d*T)*j,t[9]=(i*F-e*G-a*T)*j,t[10]=(y*E-w*A+v*b)*j,t[11]=(_*A-m*E-g*b)*j,t[12]=(h*H-l*k-u*T)*j,t[13]=(e*k-i*H+r*T)*j,t[14]=(w*I-y*D-M*b)*j,t[15]=(m*D-_*I+p*b)*j,this}scale(t){const e=this.elements,i=t.x,r=t.y,a=t.z;return e[0]*=i,e[4]*=r,e[8]*=a,e[1]*=i,e[5]*=r,e[9]*=a,e[2]*=i,e[6]*=r,e[10]*=a,e[3]*=i,e[7]*=r,e[11]*=a,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],r=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,i,r))}makeTranslation(t,e,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,i,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,e,-i,0,0,i,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,0,i,0,0,1,0,0,-i,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),i=Math.sin(t);return this.set(e,-i,0,0,i,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const i=Math.cos(e),r=Math.sin(e),a=1-i,l=t.x,h=t.y,u=t.z,d=a*l,m=a*h;return this.set(d*l+i,d*h-r*u,d*u+r*h,0,d*h+r*u,m*h+i,m*u-r*l,0,d*u-r*h,m*u+r*l,a*u*u+i,0,0,0,0,1),this}makeScale(t,e,i){return this.set(t,0,0,0,0,e,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,e,i,r,a,l){return this.set(1,i,a,0,t,1,l,0,e,r,1,0,0,0,0,1),this}compose(t,e,i){const r=this.elements,a=e._x,l=e._y,h=e._z,u=e._w,d=a+a,m=l+l,_=h+h,p=a*d,g=a*m,y=a*_,w=l*m,M=l*_,v=h*_,b=u*d,I=u*m,A=u*_,D=i.x,E=i.y,x=i.z;return r[0]=(1-(w+v))*D,r[1]=(g+A)*D,r[2]=(y-I)*D,r[3]=0,r[4]=(g-A)*E,r[5]=(1-(p+v))*E,r[6]=(M+b)*E,r[7]=0,r[8]=(y+I)*x,r[9]=(M-b)*x,r[10]=(1-(p+w))*x,r[11]=0,r[12]=t.x,r[13]=t.y,r[14]=t.z,r[15]=1,this}decompose(t,e,i){const r=this.elements;t.x=r[12],t.y=r[13],t.z=r[14];const a=this.determinantAffine();if(a===0)return i.set(1,1,1),e.identity(),this;let l=nr.set(r[0],r[1],r[2]).length();const h=nr.set(r[4],r[5],r[6]).length(),u=nr.set(r[8],r[9],r[10]).length();a<0&&(l=-l),li.copy(this);const d=1/l,m=1/h,_=1/u;return li.elements[0]*=d,li.elements[1]*=d,li.elements[2]*=d,li.elements[4]*=m,li.elements[5]*=m,li.elements[6]*=m,li.elements[8]*=_,li.elements[9]*=_,li.elements[10]*=_,e.setFromRotationMatrix(li),i.x=l,i.y=h,i.z=u,this}makePerspective(t,e,i,r,a,l,h=mi,u=!1){const d=this.elements,m=2*a/(e-t),_=2*a/(i-r),p=(e+t)/(e-t),g=(i+r)/(i-r);let y,w;if(u)y=a/(l-a),w=l*a/(l-a);else if(h===mi)y=-(l+a)/(l-a),w=-2*l*a/(l-a);else if(h===uo)y=-l/(l-a),w=-l*a/(l-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+h);return d[0]=m,d[4]=0,d[8]=p,d[12]=0,d[1]=0,d[5]=_,d[9]=g,d[13]=0,d[2]=0,d[6]=0,d[10]=y,d[14]=w,d[3]=0,d[7]=0,d[11]=-1,d[15]=0,this}makeOrthographic(t,e,i,r,a,l,h=mi,u=!1){const d=this.elements,m=2/(e-t),_=2/(i-r),p=-(e+t)/(e-t),g=-(i+r)/(i-r);let y,w;if(u)y=1/(l-a),w=l/(l-a);else if(h===mi)y=-2/(l-a),w=-(l+a)/(l-a);else if(h===uo)y=-1/(l-a),w=-a/(l-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+h);return d[0]=m,d[4]=0,d[8]=0,d[12]=p,d[1]=0,d[5]=_,d[9]=0,d[13]=g,d[2]=0,d[6]=0,d[10]=y,d[14]=w,d[3]=0,d[7]=0,d[11]=0,d[15]=1,this}equals(t){const e=this.elements,i=t.elements;for(let r=0;r<16;r++)if(e[r]!==i[r])return!1;return!0}fromArray(t,e=0){for(let i=0;i<16;i++)this.elements[i]=t[i+e];return this}toArray(t=[],e=0){const i=this.elements;return t[e]=i[0],t[e+1]=i[1],t[e+2]=i[2],t[e+3]=i[3],t[e+4]=i[4],t[e+5]=i[5],t[e+6]=i[6],t[e+7]=i[7],t[e+8]=i[8],t[e+9]=i[9],t[e+10]=i[10],t[e+11]=i[11],t[e+12]=i[12],t[e+13]=i[13],t[e+14]=i[14],t[e+15]=i[15],t}};Oa.prototype.isMatrix4=!0;let Ae=Oa;const nr=new nt,li=new Ae,l_=new nt(0,0,0),c_=new nt(1,1,1),rs=new nt,Ho=new nt,Wn=new nt,Tu=new Ae,Au=new Kn;class xs{constructor(t=0,e=0,i=0,r=xs.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=i,this._order=r}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,i,r=this._order){return this._x=t,this._y=e,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,i=!0){const r=t.elements,a=r[0],l=r[4],h=r[8],u=r[1],d=r[5],m=r[9],_=r[2],p=r[6],g=r[10];switch(e){case"XYZ":this._y=Math.asin(Me(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(-m,g),this._z=Math.atan2(-l,a)):(this._x=Math.atan2(p,d),this._z=0);break;case"YXZ":this._x=Math.asin(-Me(m,-1,1)),Math.abs(m)<.9999999?(this._y=Math.atan2(h,g),this._z=Math.atan2(u,d)):(this._y=Math.atan2(-_,a),this._z=0);break;case"ZXY":this._x=Math.asin(Me(p,-1,1)),Math.abs(p)<.9999999?(this._y=Math.atan2(-_,g),this._z=Math.atan2(-l,d)):(this._y=0,this._z=Math.atan2(u,a));break;case"ZYX":this._y=Math.asin(-Me(_,-1,1)),Math.abs(_)<.9999999?(this._x=Math.atan2(p,g),this._z=Math.atan2(u,a)):(this._x=0,this._z=Math.atan2(-l,d));break;case"YZX":this._z=Math.asin(Me(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(-m,d),this._y=Math.atan2(-_,a)):(this._x=0,this._y=Math.atan2(h,g));break;case"XZY":this._z=Math.asin(-Me(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(p,d),this._y=Math.atan2(h,a)):(this._x=Math.atan2(-m,g),this._y=0);break;default:re("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,i){return Tu.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Tu,e,i)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Au.setFromEuler(this),this.setFromQuaternion(Au,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}xs.DEFAULT_ORDER="XYZ";class ah{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let h_=0;const Ru=new nt,ir=new Kn,ki=new Ae,Go=new nt,kr=new nt,u_=new nt,d_=new Kn,Pu=new nt(1,0,0),Cu=new nt(0,1,0),Lu=new nt(0,0,1),Iu={type:"added"},f_={type:"removed"},sr={type:"childadded",child:null},Sl={type:"childremoved",child:null};class vn extends Hs{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:h_++}),this.uuid=Tr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=vn.DEFAULT_UP.clone();const t=new nt,e=new xs,i=new Kn,r=new nt(1,1,1);function a(){i.setFromEuler(e,!1)}function l(){e.setFromQuaternion(i,void 0,!1)}e._onChange(a),i._onChange(l),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Ae},normalMatrix:{value:new oe}}),this.matrix=new Ae,this.matrixWorld=new Ae,this.matrixAutoUpdate=vn.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=vn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ah,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return ir.setFromAxisAngle(t,e),this.quaternion.multiply(ir),this}rotateOnWorldAxis(t,e){return ir.setFromAxisAngle(t,e),this.quaternion.premultiply(ir),this}rotateX(t){return this.rotateOnAxis(Pu,t)}rotateY(t){return this.rotateOnAxis(Cu,t)}rotateZ(t){return this.rotateOnAxis(Lu,t)}translateOnAxis(t,e){return Ru.copy(t).applyQuaternion(this.quaternion),this.position.add(Ru.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Pu,t)}translateY(t){return this.translateOnAxis(Cu,t)}translateZ(t){return this.translateOnAxis(Lu,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(ki.copy(this.matrixWorld).invert())}lookAt(t,e,i){t.isVector3?Go.copy(t):Go.set(t,e,i);const r=this.parent;this.updateWorldMatrix(!0,!1),kr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ki.lookAt(kr,Go,this.up):ki.lookAt(Go,kr,this.up),this.quaternion.setFromRotationMatrix(ki),r&&(ki.extractRotation(r.matrixWorld),ir.setFromRotationMatrix(ki),this.quaternion.premultiply(ir.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(Te("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Iu),sr.child=t,this.dispatchEvent(sr),sr.child=null):Te("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(f_),Sl.child=t,this.dispatchEvent(Sl),Sl.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),ki.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),ki.multiply(t.parent.matrixWorld)),t.applyMatrix4(ki),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Iu),sr.child=t,this.dispatchEvent(sr),sr.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let i=0,r=this.children.length;i<r;i++){const l=this.children[i].getObjectByProperty(t,e);if(l!==void 0)return l}}getObjectsByProperty(t,e,i=[]){this[t]===e&&i.push(this);const r=this.children;for(let a=0,l=r.length;a<l;a++)r[a].getObjectsByProperty(t,e,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(kr,t,u_),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(kr,d_,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,i=t.y,r=t.z,a=this.matrix.elements;a[12]+=e-a[0]*e-a[4]*i-a[8]*r,a[13]+=i-a[1]*e-a[5]*i-a[9]*r,a[14]+=r-a[2]*e-a[6]*i-a[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let i=0,r=e.length;i<r;i++)e[i].updateMatrixWorld(t)}updateWorldMatrix(t,e,i=!1){const r=this.parent;if(t===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),e===!0){const a=this.children;for(let l=0,h=a.length;l<h;l++)a[l].updateWorldMatrix(!1,!0,i)}}toJSON(t){const e=t===void 0||typeof t=="string",i={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(h=>({...h,boundingBox:h.boundingBox?h.boundingBox.toJSON():void 0,boundingSphere:h.boundingSphere?h.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(h=>({...h})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(t),r.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function a(h,u){return h[u.uuid]===void 0&&(h[u.uuid]=u.toJSON(t)),u.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=a(t.geometries,this.geometry);const h=this.geometry.parameters;if(h!==void 0&&h.shapes!==void 0){const u=h.shapes;if(Array.isArray(u))for(let d=0,m=u.length;d<m;d++){const _=u[d];a(t.shapes,_)}else a(t.shapes,u)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const h=[];for(let u=0,d=this.material.length;u<d;u++)h.push(a(t.materials,this.material[u]));r.material=h}else r.material=a(t.materials,this.material);if(this.children.length>0){r.children=[];for(let h=0;h<this.children.length;h++)r.children.push(this.children[h].toJSON(t).object)}if(this.animations.length>0){r.animations=[];for(let h=0;h<this.animations.length;h++){const u=this.animations[h];r.animations.push(a(t.animations,u))}}if(e){const h=l(t.geometries),u=l(t.materials),d=l(t.textures),m=l(t.images),_=l(t.shapes),p=l(t.skeletons),g=l(t.animations),y=l(t.nodes);h.length>0&&(i.geometries=h),u.length>0&&(i.materials=u),d.length>0&&(i.textures=d),m.length>0&&(i.images=m),_.length>0&&(i.shapes=_),p.length>0&&(i.skeletons=p),g.length>0&&(i.animations=g),y.length>0&&(i.nodes=y)}return i.object=r,i;function l(h){const u=[];for(const d in h){const m=h[d];delete m.metadata,u.push(m)}return u}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let i=0;i<t.children.length;i++){const r=t.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}vn.DEFAULT_UP=new nt(0,1,0);vn.DEFAULT_MATRIX_AUTO_UPDATE=!0;vn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class hn extends vn{constructor(){super(),this.isGroup=!0,this.type="Group"}}const p_={type:"move"};class wl{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new hn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new hn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new nt,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new nt),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new hn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new nt,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new nt,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const i of t.hand.values())this._getHandJoint(e,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,i){let r=null,a=null,l=null;const h=this._targetRay,u=this._grip,d=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(d&&t.hand){l=!0;for(const w of t.hand.values()){const M=e.getJointPose(w,i),v=this._getHandJoint(d,w);M!==null&&(v.matrix.fromArray(M.transform.matrix),v.matrix.decompose(v.position,v.quaternion,v.scale),v.matrixWorldNeedsUpdate=!0,v.jointRadius=M.radius),v.visible=M!==null}const m=d.joints["index-finger-tip"],_=d.joints["thumb-tip"],p=m.position.distanceTo(_.position),g=.02,y=.005;d.inputState.pinching&&p>g+y?(d.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!d.inputState.pinching&&p<=g-y&&(d.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else u!==null&&t.gripSpace&&(a=e.getPose(t.gripSpace,i),a!==null&&(u.matrix.fromArray(a.transform.matrix),u.matrix.decompose(u.position,u.quaternion,u.scale),u.matrixWorldNeedsUpdate=!0,a.linearVelocity?(u.hasLinearVelocity=!0,u.linearVelocity.copy(a.linearVelocity)):u.hasLinearVelocity=!1,a.angularVelocity?(u.hasAngularVelocity=!0,u.angularVelocity.copy(a.angularVelocity)):u.hasAngularVelocity=!1,u.eventsEnabled&&u.dispatchEvent({type:"gripUpdated",data:t,target:this})));h!==null&&(r=e.getPose(t.targetRaySpace,i),r===null&&a!==null&&(r=a),r!==null&&(h.matrix.fromArray(r.transform.matrix),h.matrix.decompose(h.position,h.quaternion,h.scale),h.matrixWorldNeedsUpdate=!0,r.linearVelocity?(h.hasLinearVelocity=!0,h.linearVelocity.copy(r.linearVelocity)):h.hasLinearVelocity=!1,r.angularVelocity?(h.hasAngularVelocity=!0,h.angularVelocity.copy(r.angularVelocity)):h.hasAngularVelocity=!1,this.dispatchEvent(p_)))}return h!==null&&(h.visible=r!==null),u!==null&&(u.visible=a!==null),d!==null&&(d.visible=l!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const i=new hn;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[e.jointName]=i,t.add(i)}return t.joints[e.jointName]}}const gf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},os={h:0,s:0,l:0},Vo={h:0,s:0,l:0};function bl(s,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?s+(t-s)*6*e:e<1/2?t:e<2/3?s+(t-s)*6*(2/3-e):s}class Qt{constructor(t,e,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,i)}set(t,e,i){if(e===void 0&&i===void 0){const r=t;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(t,e,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Cn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,xe.colorSpaceToWorking(this,e),this}setRGB(t,e,i,r=xe.workingColorSpace){return this.r=t,this.g=e,this.b=i,xe.colorSpaceToWorking(this,r),this}setHSL(t,e,i,r=xe.workingColorSpace){if(t=sh(t,1),e=Me(e,0,1),i=Me(i,0,1),e===0)this.r=this.g=this.b=i;else{const a=i<=.5?i*(1+e):i+e-i*e,l=2*i-a;this.r=bl(l,a,t+1/3),this.g=bl(l,a,t),this.b=bl(l,a,t-1/3)}return xe.colorSpaceToWorking(this,r),this}setStyle(t,e=Cn){function i(a){a!==void 0&&parseFloat(a)<1&&re("Color: Alpha component of "+t+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(t)){let a;const l=r[1],h=r[2];switch(l){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(h))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,e);if(a=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(h))return i(a[4]),this.setRGB(Math.min(100,parseFloat(a[1]))/100,Math.min(100,parseFloat(a[2]))/100,Math.min(100,parseFloat(a[3]))/100,e);break;case"hsl":case"hsla":if(a=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(h))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,e);break;default:re("Color: Unknown color model "+t)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(t)){const a=r[1],l=a.length;if(l===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,e);if(l===6)return this.setHex(parseInt(a,16),e);re("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Cn){const i=gf[t.toLowerCase()];return i!==void 0?this.setHex(i,e):re("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Qi(t.r),this.g=Qi(t.g),this.b=Qi(t.b),this}copyLinearToSRGB(t){return this.r=xr(t.r),this.g=xr(t.g),this.b=xr(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Cn){return xe.workingToColorSpace(Rn.copy(this),t),Math.round(Me(Rn.r*255,0,255))*65536+Math.round(Me(Rn.g*255,0,255))*256+Math.round(Me(Rn.b*255,0,255))}getHexString(t=Cn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=xe.workingColorSpace){xe.workingToColorSpace(Rn.copy(this),e);const i=Rn.r,r=Rn.g,a=Rn.b,l=Math.max(i,r,a),h=Math.min(i,r,a);let u,d;const m=(h+l)/2;if(h===l)u=0,d=0;else{const _=l-h;switch(d=m<=.5?_/(l+h):_/(2-l-h),l){case i:u=(r-a)/_+(r<a?6:0);break;case r:u=(a-i)/_+2;break;case a:u=(i-r)/_+4;break}u/=6}return t.h=u,t.s=d,t.l=m,t}getRGB(t,e=xe.workingColorSpace){return xe.workingToColorSpace(Rn.copy(this),e),t.r=Rn.r,t.g=Rn.g,t.b=Rn.b,t}getStyle(t=Cn){xe.workingToColorSpace(Rn.copy(this),t);const e=Rn.r,i=Rn.g,r=Rn.b;return t!==Cn?`color(${t} ${e.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(t,e,i){return this.getHSL(os),this.setHSL(os.h+t,os.s+e,os.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,i){return this.r=t.r+(e.r-t.r)*i,this.g=t.g+(e.g-t.g)*i,this.b=t.b+(e.b-t.b)*i,this}lerpHSL(t,e){this.getHSL(os),t.getHSL(Vo);const i=no(os.h,Vo.h,e),r=no(os.s,Vo.s,e),a=no(os.l,Vo.l,e);return this.setHSL(i,r,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,i=this.g,r=this.b,a=t.elements;return this.r=a[0]*e+a[3]*i+a[6]*r,this.g=a[1]*e+a[4]*i+a[7]*r,this.b=a[2]*e+a[5]*i+a[8]*r,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Rn=new Qt;Qt.NAMES=gf;class lh{constructor(t,e=1,i=1e3){this.isFog=!0,this.name="",this.color=new Qt(t),this.near=e,this.far=i}clone(){return new lh(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class vf extends vn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new xs,this.environmentIntensity=1,this.environmentRotation=new xs,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}}const ci=new nt,Hi=new nt,El=new nt,Gi=new nt,rr=new nt,or=new nt,Du=new nt,Tl=new nt,Al=new nt,Rl=new nt,Pl=new Ze,Cl=new Ze,Ll=new Ze;class fi{constructor(t=new nt,e=new nt,i=new nt){this.a=t,this.b=e,this.c=i}static getNormal(t,e,i,r){r.subVectors(i,e),ci.subVectors(t,e),r.cross(ci);const a=r.lengthSq();return a>0?r.multiplyScalar(1/Math.sqrt(a)):r.set(0,0,0)}static getBarycoord(t,e,i,r,a){ci.subVectors(r,e),Hi.subVectors(i,e),El.subVectors(t,e);const l=ci.dot(ci),h=ci.dot(Hi),u=ci.dot(El),d=Hi.dot(Hi),m=Hi.dot(El),_=l*d-h*h;if(_===0)return a.set(0,0,0),null;const p=1/_,g=(d*u-h*m)*p,y=(l*m-h*u)*p;return a.set(1-g-y,y,g)}static containsPoint(t,e,i,r){return this.getBarycoord(t,e,i,r,Gi)===null?!1:Gi.x>=0&&Gi.y>=0&&Gi.x+Gi.y<=1}static getInterpolation(t,e,i,r,a,l,h,u){return this.getBarycoord(t,e,i,r,Gi)===null?(u.x=0,u.y=0,"z"in u&&(u.z=0),"w"in u&&(u.w=0),null):(u.setScalar(0),u.addScaledVector(a,Gi.x),u.addScaledVector(l,Gi.y),u.addScaledVector(h,Gi.z),u)}static getInterpolatedAttribute(t,e,i,r,a,l){return Pl.setScalar(0),Cl.setScalar(0),Ll.setScalar(0),Pl.fromBufferAttribute(t,e),Cl.fromBufferAttribute(t,i),Ll.fromBufferAttribute(t,r),l.setScalar(0),l.addScaledVector(Pl,a.x),l.addScaledVector(Cl,a.y),l.addScaledVector(Ll,a.z),l}static isFrontFacing(t,e,i,r){return ci.subVectors(i,e),Hi.subVectors(t,e),ci.cross(Hi).dot(r)<0}set(t,e,i){return this.a.copy(t),this.b.copy(e),this.c.copy(i),this}setFromPointsAndIndices(t,e,i,r){return this.a.copy(t[e]),this.b.copy(t[i]),this.c.copy(t[r]),this}setFromAttributeAndIndices(t,e,i,r){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,r),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return ci.subVectors(this.c,this.b),Hi.subVectors(this.a,this.b),ci.cross(Hi).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return fi.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return fi.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,i,r,a){return fi.getInterpolation(t,this.a,this.b,this.c,e,i,r,a)}containsPoint(t){return fi.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return fi.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const i=this.a,r=this.b,a=this.c;let l,h;rr.subVectors(r,i),or.subVectors(a,i),Tl.subVectors(t,i);const u=rr.dot(Tl),d=or.dot(Tl);if(u<=0&&d<=0)return e.copy(i);Al.subVectors(t,r);const m=rr.dot(Al),_=or.dot(Al);if(m>=0&&_<=m)return e.copy(r);const p=u*_-m*d;if(p<=0&&u>=0&&m<=0&&u-m>0)return l=u/(u-m),e.copy(i).addScaledVector(rr,l);Rl.subVectors(t,a);const g=rr.dot(Rl),y=or.dot(Rl);if(y>=0&&g<=y)return e.copy(a);const w=g*d-u*y;if(w<=0&&d>=0&&y<=0)return h=d/(d-y),e.copy(i).addScaledVector(or,h);const M=m*y-g*_;if(M<=0&&_-m>=0&&g-y>=0)return Du.subVectors(a,r),h=(_-m)/(_-m+(g-y)),e.copy(r).addScaledVector(Du,h);const v=1/(M+w+p);return l=w*v,h=p*v,e.copy(i).addScaledVector(rr,l).addScaledVector(or,h)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class ys{constructor(t=new nt(1/0,1/0,1/0),e=new nt(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e+=3)this.expandByPoint(hi.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,i=t.count;e<i;e++)this.expandByPoint(hi.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,i=t.length;e<i;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const i=hi.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const i=t.geometry;if(i!==void 0){const a=i.getAttribute("position");if(e===!0&&a!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let l=0,h=a.count;l<h;l++)t.isMesh===!0?t.getVertexPosition(l,hi):hi.fromBufferAttribute(a,l),hi.applyMatrix4(t.matrixWorld),this.expandByPoint(hi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Wo.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Wo.copy(i.boundingBox)),Wo.applyMatrix4(t.matrixWorld),this.union(Wo)}const r=t.children;for(let a=0,l=r.length;a<l;a++)this.expandByObject(r[a],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,hi),hi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,i;return t.normal.x>0?(e=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),e<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Hr),Xo.subVectors(this.max,Hr),ar.subVectors(t.a,Hr),lr.subVectors(t.b,Hr),cr.subVectors(t.c,Hr),as.subVectors(lr,ar),ls.subVectors(cr,lr),As.subVectors(ar,cr);let e=[0,-as.z,as.y,0,-ls.z,ls.y,0,-As.z,As.y,as.z,0,-as.x,ls.z,0,-ls.x,As.z,0,-As.x,-as.y,as.x,0,-ls.y,ls.x,0,-As.y,As.x,0];return!Il(e,ar,lr,cr,Xo)||(e=[1,0,0,0,1,0,0,0,1],!Il(e,ar,lr,cr,Xo))?!1:(Zo.crossVectors(as,ls),e=[Zo.x,Zo.y,Zo.z],Il(e,ar,lr,cr,Xo))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,hi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(hi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Vi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Vi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Vi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Vi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Vi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Vi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Vi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Vi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Vi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const Vi=[new nt,new nt,new nt,new nt,new nt,new nt,new nt,new nt],hi=new nt,Wo=new ys,ar=new nt,lr=new nt,cr=new nt,as=new nt,ls=new nt,As=new nt,Hr=new nt,Xo=new nt,Zo=new nt,Rs=new nt;function Il(s,t,e,i,r){for(let a=0,l=s.length-3;a<=l;a+=3){Rs.fromArray(s,a);const h=r.x*Math.abs(Rs.x)+r.y*Math.abs(Rs.y)+r.z*Math.abs(Rs.z),u=t.dot(Rs),d=e.dot(Rs),m=i.dot(Rs);if(Math.max(-Math.max(u,d,m),Math.min(u,d,m))>h)return!1}return!0}const sn=new nt,qo=new le;let m_=0;class xn extends Hs{constructor(t,e,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:m_++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=i,this.usage=Um,this.updateRanges=[],this.gpuType=pi,this.version=0,this._normalizationScale=t!==void 0?rh(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,i){t*=this.itemSize,i*=e.itemSize;for(let r=0,a=this.itemSize;r<a;r++)this.array[t+r]=e.array[i+r];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,i=this.count;e<i;e++)qo.fromBufferAttribute(this,e),qo.applyMatrix3(t),this.setXY(e,qo.x,qo.y);else if(this.itemSize===3)for(let e=0,i=this.count;e<i;e++)sn.fromBufferAttribute(this,e),sn.applyMatrix3(t),this.setXYZ(e,sn.x,sn.y,sn.z);return this}applyMatrix4(t){for(let e=0,i=this.count;e<i;e++)sn.fromBufferAttribute(this,e),sn.applyMatrix4(t),this.setXYZ(e,sn.x,sn.y,sn.z);return this}applyNormalMatrix(t){for(let e=0,i=this.count;e<i;e++)sn.fromBufferAttribute(this,e),sn.applyNormalMatrix(t),this.setXYZ(e,sn.x,sn.y,sn.z);return this}transformDirection(t){for(let e=0,i=this.count;e<i;e++)sn.fromBufferAttribute(this,e),sn.transformDirection(t),this.setXYZ(e,sn.x,sn.y,sn.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let i=this.array[t*this.itemSize+e];return this.normalized&&(i=this._denormalize(i)),i}setComponent(t,e,i){return this.normalized&&(i=this._normalize(i)),this.array[t*this.itemSize+e]=i,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,i){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),i=this._normalize(i)),this.array[t+0]=e,this.array[t+1]=i,this}setXYZ(t,e,i,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),i=this._normalize(i),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this}setXYZW(t,e,i,r,a){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),i=this._normalize(i),r=this._normalize(r),a=this._normalize(a)),this.array[t+0]=e,this.array[t+1]=i,this.array[t+2]=r,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){const e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):pf(t,this.array)}_normalize(t){const e=this._normalizationScale;return e!==void 0?Math.round(t*e):mf(t,this.array)}}class xf extends xn{constructor(t,e,i){super(new Uint16Array(t),e,i)}}class Mf extends xn{constructor(t,e,i){super(new Uint32Array(t),e,i)}}class Mn extends xn{constructor(t,e,i){super(new Float32Array(t),e,i)}}const __=new ys,Gr=new nt,Dl=new nt;class Ar{constructor(t=new nt,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const i=this.center;e!==void 0?i.copy(e):__.setFromPoints(t).getCenter(i);let r=0;for(let a=0,l=t.length;a<l;a++)r=Math.max(r,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(r),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const i=this.center.distanceToSquared(t);return e.copy(t),i>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Gr.subVectors(t,this.center);const e=Gr.lengthSq();if(e>this.radius*this.radius){const i=Math.sqrt(e),r=(i-this.radius)*.5;this.center.addScaledVector(Gr,r/i),this.radius+=r}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Dl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Gr.copy(t.center).add(Dl)),this.expandByPoint(Gr.copy(t.center).sub(Dl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let g_=0;const ei=new Ae,Nl=new vn,hr=new nt,Xn=new ys,Vr=new ys,mn=new nt;class yn extends Hs{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:g_++}),this.uuid=Tr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Om(t)?Mf:xf)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,i=0){this.groups.push({start:t,count:e,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const a=new oe().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(t),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return ei.makeRotationFromQuaternion(t),this.applyMatrix4(ei),this}rotateX(t){return ei.makeRotationX(t),this.applyMatrix4(ei),this}rotateY(t){return ei.makeRotationY(t),this.applyMatrix4(ei),this}rotateZ(t){return ei.makeRotationZ(t),this.applyMatrix4(ei),this}translate(t,e,i){return ei.makeTranslation(t,e,i),this.applyMatrix4(ei),this}scale(t,e,i){return ei.makeScale(t,e,i),this.applyMatrix4(ei),this}lookAt(t){return Nl.lookAt(t),Nl.updateMatrix(),this.applyMatrix4(Nl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(hr).negate(),this.translate(hr.x,hr.y,hr.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const i=[];for(let r=0,a=t.length;r<a;r++){const l=t[r];i.push(l.x,l.y,l.z||0)}this.setAttribute("position",new Mn(i,3))}else{const i=Math.min(t.length,e.count);for(let r=0;r<i;r++){const a=t[r];e.setXYZ(r,a.x,a.y,a.z||0)}t.length>e.count&&re("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ys);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Te("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new nt(-1/0,-1/0,-1/0),new nt(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let i=0,r=e.length;i<r;i++){const a=e[i];Xn.setFromBufferAttribute(a),this.morphTargetsRelative?(mn.addVectors(this.boundingBox.min,Xn.min),this.boundingBox.expandByPoint(mn),mn.addVectors(this.boundingBox.max,Xn.max),this.boundingBox.expandByPoint(mn)):(this.boundingBox.expandByPoint(Xn.min),this.boundingBox.expandByPoint(Xn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Te('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ar);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Te("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new nt,1/0);return}if(t){const i=this.boundingSphere.center;if(Xn.setFromBufferAttribute(t),e)for(let a=0,l=e.length;a<l;a++){const h=e[a];Vr.setFromBufferAttribute(h),this.morphTargetsRelative?(mn.addVectors(Xn.min,Vr.min),Xn.expandByPoint(mn),mn.addVectors(Xn.max,Vr.max),Xn.expandByPoint(mn)):(Xn.expandByPoint(Vr.min),Xn.expandByPoint(Vr.max))}Xn.getCenter(i);let r=0;for(let a=0,l=t.count;a<l;a++)mn.fromBufferAttribute(t,a),r=Math.max(r,i.distanceToSquared(mn));if(e)for(let a=0,l=e.length;a<l;a++){const h=e[a],u=this.morphTargetsRelative;for(let d=0,m=h.count;d<m;d++)mn.fromBufferAttribute(h,d),u&&(hr.fromBufferAttribute(t,d),mn.add(hr)),r=Math.max(r,i.distanceToSquared(mn))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Te('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){Te("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=e.position,r=e.normal,a=e.uv;let l=this.getAttribute("tangent");(l===void 0||l.count!==i.count)&&(l=new xn(new Float32Array(4*i.count),4),this.setAttribute("tangent",l));const h=[],u=[],d=new Uint8Array(i.count);for(let H=0;H<i.count;H++)h[H]=new nt,u[H]=new nt;const m=new nt,_=new nt,p=new nt,g=new le,y=new le,w=new le,M=new nt,v=new nt;function b(H,F,k){d[H]=d[F]=d[k]=1,m.fromBufferAttribute(i,H),_.fromBufferAttribute(i,F),p.fromBufferAttribute(i,k),g.fromBufferAttribute(a,H),y.fromBufferAttribute(a,F),w.fromBufferAttribute(a,k),_.sub(m),p.sub(m),y.sub(g),w.sub(g);const G=1/(y.x*w.y-w.x*y.y);isFinite(G)&&(M.copy(_).multiplyScalar(w.y).addScaledVector(p,-y.y).multiplyScalar(G),v.copy(p).multiplyScalar(y.x).addScaledVector(_,-w.x).multiplyScalar(G),h[H].add(M),h[F].add(M),h[k].add(M),u[H].add(v),u[F].add(v),u[k].add(v))}let I=this.groups;I.length===0&&(I=[{start:0,count:t.count}]);for(let H=0,F=I.length;H<F;++H){const k=I[H],G=k.start,W=k.count;for(let z=G,j=G+W;z<j;z+=3)b(t.getX(z+0),t.getX(z+1),t.getX(z+2))}const A=new nt,D=new nt,E=new nt,x=new nt;function T(H){E.fromBufferAttribute(r,H),x.copy(E);const F=h[H];A.copy(F),A.sub(E.multiplyScalar(E.dot(F))).normalize(),D.crossVectors(x,F);const G=D.dot(u[H])<0?-1:1;l.setXYZW(H,A.x,A.y,A.z,G)}for(let H=0,F=i.count;H<F;++H)d[H]&&T(H);this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==e.count)i=new xn(new Float32Array(e.count*3),3),this.setAttribute("normal",i);else for(let p=0,g=i.count;p<g;p++)i.setXYZ(p,0,0,0);const r=new nt,a=new nt,l=new nt,h=new nt,u=new nt,d=new nt,m=new nt,_=new nt;if(t)for(let p=0,g=t.count;p<g;p+=3){const y=t.getX(p+0),w=t.getX(p+1),M=t.getX(p+2);r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,w),l.fromBufferAttribute(e,M),m.subVectors(l,a),_.subVectors(r,a),m.cross(_),h.fromBufferAttribute(i,y),u.fromBufferAttribute(i,w),d.fromBufferAttribute(i,M),h.add(m),u.add(m),d.add(m),i.setXYZ(y,h.x,h.y,h.z),i.setXYZ(w,u.x,u.y,u.z),i.setXYZ(M,d.x,d.y,d.z)}else for(let p=0,g=e.count;p<g;p+=3)r.fromBufferAttribute(e,p+0),a.fromBufferAttribute(e,p+1),l.fromBufferAttribute(e,p+2),m.subVectors(l,a),_.subVectors(r,a),m.cross(_),i.setXYZ(p+0,m.x,m.y,m.z),i.setXYZ(p+1,m.x,m.y,m.z),i.setXYZ(p+2,m.x,m.y,m.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,i=t.count;e<i;e++)mn.fromBufferAttribute(t,e),mn.normalize(),t.setXYZ(e,mn.x,mn.y,mn.z)}toNonIndexed(){function t(h,u){const d=h.array,m=h.itemSize,_=h.normalized,p=new d.constructor(u.length*m);let g=0,y=0;for(let w=0,M=u.length;w<M;w++){h.isInterleavedBufferAttribute?g=u[w]*h.data.stride+h.offset:g=u[w]*m;for(let v=0;v<m;v++)p[y++]=d[g++]}return new xn(p,m,_)}if(this.index===null)return re("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new yn,i=this.index.array,r=this.attributes;for(const h in r){const u=r[h],d=t(u,i);e.setAttribute(h,d)}const a=this.morphAttributes;for(const h in a){const u=[],d=a[h];for(let m=0,_=d.length;m<_;m++){const p=d[m],g=t(p,i);u.push(g)}e.morphAttributes[h]=u}e.morphTargetsRelative=this.morphTargetsRelative;const l=this.groups;for(let h=0,u=l.length;h<u;h++){const d=l[h];e.addGroup(d.start,d.count,d.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const u=this.parameters;for(const d in u)u[d]!==void 0&&(t[d]=u[d]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const i=this.attributes;for(const u in i){const d=i[u];t.data.attributes[u]=d.toJSON(t.data)}const r={};let a=!1;for(const u in this.morphAttributes){const d=this.morphAttributes[u],m=[];for(let _=0,p=d.length;_<p;_++){const g=d[_];m.push(g.toJSON(t.data))}m.length>0&&(r[u]=m,a=!0)}a&&(t.data.morphAttributes=r,t.data.morphTargetsRelative=this.morphTargetsRelative);const l=this.groups;l.length>0&&(t.data.groups=JSON.parse(JSON.stringify(l)));const h=this.boundingSphere;return h!==null&&(t.data.boundingSphere=h.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const i=t.index;i!==null&&this.setIndex(i.clone());const r=t.attributes;for(const d in r){const m=r[d];this.setAttribute(d,m.clone(e))}const a=t.morphAttributes;for(const d in a){const m=[],_=a[d];for(let p=0,g=_.length;p<g;p++)m.push(_[p].clone(e));this.morphAttributes[d]=m}this.morphTargetsRelative=t.morphTargetsRelative;const l=t.groups;for(let d=0,m=l.length;d<m;d++){const _=l[d];this.addGroup(_.start,_.count,_.materialIndex)}const h=t.boundingBox;h!==null&&(this.boundingBox=h.clone());const u=t.boundingSphere;return u!==null&&(this.boundingSphere=u.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Fl=new nt,v_=new nt,x_=new oe;class hs{constructor(t=new nt(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,i,r){return this.normal.set(t,e,i),this.constant=r,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,i){const r=Fl.subVectors(i,e).cross(v_.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(r,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,i=!0){const r=t.delta(Fl),a=this.normal.dot(r);if(a===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const l=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(l<0||l>1)?null:e.copy(t.start).addScaledVector(r,l)}intersectsLine(t){const e=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return e<0&&i>0||i<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const i=e||x_.getNormalMatrix(t),r=this.coplanarPoint(Fl).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let M_=0;class Rr extends Hs{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:M_++}),this.uuid=Tr(),this.name="",this.type="Material",this.blending=to,this.side=es,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Zd,this.blendDst=qd,this.blendEquation=_r,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Qt(0,0,0),this.blendAlpha=0,this.depthFunc=ao,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Cm,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=_l,this.stencilZFail=_l,this.stencilZPass=_l,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const i=t[e];if(i===void 0){re(`Material: parameter '${e}' has value of undefined.`);continue}const r=this[e];if(r===void 0){re(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[e]=i}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(i.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(i.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(i.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(i.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(a){const l=[];for(const h in a){const u=a[h];delete u.metadata,l.push(u)}return l}if(e){const a=r(t.textures),l=r(t.images);a.length>0&&(i.textures=a),l.length>0&&(i.images=l)}return i}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Qt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new hs().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new le().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new le().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let i=null;if(e!==null){const r=e.length;i=new Array(r);for(let a=0;a!==r;++a)i[a]=e[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const Wi=new nt,Ul=new nt,$o=new nt,Yo=new nt;class ch{constructor(t=new nt,e=new nt(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Wi)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const i=e.dot(this.direction);return i<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Wi.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Wi.copy(this.origin).addScaledVector(this.direction,e),Wi.distanceToSquared(t))}distanceSqToSegment(t,e,i,r){Ul.copy(t).add(e).multiplyScalar(.5),$o.copy(e).sub(t).normalize(),Yo.copy(this.origin).sub(Ul);const a=t.distanceTo(e)*.5,l=-this.direction.dot($o),h=Yo.dot(this.direction),u=-Yo.dot($o),d=Yo.lengthSq(),m=Math.abs(1-l*l);let _,p,g,y;if(m>0)if(_=l*u-h,p=l*h-u,y=a*m,_>=0)if(p>=-y)if(p<=y){const w=1/m;_*=w,p*=w,g=_*(_+l*p+2*h)+p*(l*_+p+2*u)+d}else p=a,_=Math.max(0,-(l*p+h)),g=-_*_+p*(p+2*u)+d;else p=-a,_=Math.max(0,-(l*p+h)),g=-_*_+p*(p+2*u)+d;else p<=-y?(_=Math.max(0,-(-l*a+h)),p=_>0?-a:Math.min(Math.max(-a,-u),a),g=-_*_+p*(p+2*u)+d):p<=y?(_=0,p=Math.min(Math.max(-a,-u),a),g=p*(p+2*u)+d):(_=Math.max(0,-(l*a+h)),p=_>0?a:Math.min(Math.max(-a,-u),a),g=-_*_+p*(p+2*u)+d);else p=l>0?-a:a,_=Math.max(0,-(l*p+h)),g=-_*_+p*(p+2*u)+d;return i&&i.copy(this.origin).addScaledVector(this.direction,_),r&&r.copy(Ul).addScaledVector($o,p),g}intersectSphere(t,e){if(t.radius<0)return null;Wi.subVectors(t.center,this.origin);const i=Wi.dot(this.direction),r=Wi.dot(Wi)-i*i,a=t.radius*t.radius;if(r>a)return null;const l=Math.sqrt(a-r),h=i-l,u=i+l;return u<0?null:h<0?this.at(u,e):this.at(h,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(t.normal)+t.constant)/e;return i>=0?i:null}intersectPlane(t,e){const i=this.distanceToPlane(t);return i===null?null:this.at(i,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let i,r,a,l,h,u;const d=1/this.direction.x,m=1/this.direction.y,_=1/this.direction.z,p=this.origin;return d>=0?(i=(t.min.x-p.x)*d,r=(t.max.x-p.x)*d):(i=(t.max.x-p.x)*d,r=(t.min.x-p.x)*d),m>=0?(a=(t.min.y-p.y)*m,l=(t.max.y-p.y)*m):(a=(t.max.y-p.y)*m,l=(t.min.y-p.y)*m),i>l||a>r||((a>i||isNaN(i))&&(i=a),(l<r||isNaN(r))&&(r=l),_>=0?(h=(t.min.z-p.z)*_,u=(t.max.z-p.z)*_):(h=(t.max.z-p.z)*_,u=(t.min.z-p.z)*_),i>u||h>r)||((h>i||i!==i)&&(i=h),(u<r||r!==r)&&(r=u),r<0)?null:this.at(i>=0?i:r,e)}intersectsBox(t){return this.intersectBox(t,Wi)!==null}intersectTriangle(t,e,i,r,a){const l=this.origin,h=this.direction,u=h.x,d=h.y,m=h.z,_=t.x-l.x,p=t.y-l.y,g=t.z-l.z,y=e.x-l.x,w=e.y-l.y,M=e.z-l.z,v=i.x-l.x,b=i.y-l.y,I=i.z-l.z,A=Math.abs(u),D=Math.abs(d),E=Math.abs(m);let x,T,H,F,k,G,W,z,j,rt,$,st;if(A>=D&&A>=E?(H=u,G=_,j=y,st=v,u>=0?(x=d,T=m,F=p,k=g,W=w,z=M,rt=b,$=I):(x=m,T=d,F=g,k=p,W=M,z=w,rt=I,$=b)):D>=E?(H=d,G=p,j=w,st=b,d>=0?(x=m,T=u,F=g,k=_,W=M,z=y,rt=I,$=v):(x=u,T=m,F=_,k=g,W=y,z=M,rt=v,$=I)):(H=m,G=g,j=M,st=I,m>=0?(x=u,T=d,F=_,k=p,W=y,z=w,rt=v,$=b):(x=d,T=u,F=p,k=_,W=w,z=y,rt=b,$=v)),H===0)return null;const tt=x/H,Y=T/H,lt=1/H,St=F-tt*G,Dt=k-Y*G,J=W-tt*j,Mt=z-Y*j,yt=rt-tt*st,Wt=$-Y*st,Rt=yt*Mt-Wt*J,jt=St*Wt-Dt*yt,we=J*Dt-Mt*St;if(r){if(Rt<0||jt<0||we<0)return null}else if((Rt<0||jt<0||we<0)&&(Rt>0||jt>0||we>0))return null;const Jt=Rt+jt+we;if(Jt===0)return null;const fe=lt*(Rt*G+jt*j+we*st);return(Jt>0?fe<0:fe>0)?null:this.at(fe/Jt,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Hn extends Rr{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Qt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new xs,this.combine=Kc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const Nu=new Ae,Ps=new ch,Ko=new Ar,Fu=new nt,Jo=new nt,Qo=new nt,jo=new nt,Ol=new nt,ta=new nt,Uu=new nt,ea=new nt;class pe extends vn{constructor(t=new yn,e=new Hn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,l=r.length;a<l;a++){const h=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[h]=a}}}}getVertexPosition(t,e){const i=this.geometry,r=i.attributes.position,a=i.morphAttributes.position,l=i.morphTargetsRelative;e.fromBufferAttribute(r,t);const h=this.morphTargetInfluences;if(a&&h){ta.set(0,0,0);for(let u=0,d=a.length;u<d;u++){const m=h[u],_=a[u];m!==0&&(Ol.fromBufferAttribute(_,t),l?ta.addScaledVector(Ol,m):ta.addScaledVector(Ol.sub(e),m))}e.add(ta)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const i=this.geometry,r=this.material,a=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ko.copy(i.boundingSphere),Ko.applyMatrix4(a),Ps.copy(t.ray).recast(t.near),!(Ko.containsPoint(Ps.origin)===!1&&(Ps.intersectSphere(Ko,Fu)===null||Ps.origin.distanceToSquared(Fu)>(t.far-t.near)**2))&&(Nu.copy(a).invert(),Ps.copy(t.ray).applyMatrix4(Nu),!(i.boundingBox!==null&&Ps.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,e,Ps)))}_computeIntersections(t,e,i){let r;const a=this.geometry,l=this.material,h=a.index,u=a.attributes.position,d=a.attributes.uv,m=a.attributes.uv1,_=a.attributes.normal,p=a.groups,g=a.drawRange;if(h!==null)if(Array.isArray(l))for(let y=0,w=p.length;y<w;y++){const M=p[y],v=l[M.materialIndex],b=Math.max(M.start,g.start),I=Math.min(h.count,Math.min(M.start+M.count,g.start+g.count));for(let A=b,D=I;A<D;A+=3){const E=h.getX(A),x=h.getX(A+1),T=h.getX(A+2);r=na(this,v,t,i,d,m,_,E,x,T),r&&(r.faceIndex=Math.floor(A/3),r.face.materialIndex=M.materialIndex,e.push(r))}}else{const y=Math.max(0,g.start),w=Math.min(h.count,g.start+g.count);for(let M=y,v=w;M<v;M+=3){const b=h.getX(M),I=h.getX(M+1),A=h.getX(M+2);r=na(this,l,t,i,d,m,_,b,I,A),r&&(r.faceIndex=Math.floor(M/3),e.push(r))}}else if(u!==void 0)if(Array.isArray(l))for(let y=0,w=p.length;y<w;y++){const M=p[y],v=l[M.materialIndex],b=Math.max(M.start,g.start),I=Math.min(u.count,Math.min(M.start+M.count,g.start+g.count));for(let A=b,D=I;A<D;A+=3){const E=A,x=A+1,T=A+2;r=na(this,v,t,i,d,m,_,E,x,T),r&&(r.faceIndex=Math.floor(A/3),r.face.materialIndex=M.materialIndex,e.push(r))}}else{const y=Math.max(0,g.start),w=Math.min(u.count,g.start+g.count);for(let M=y,v=w;M<v;M+=3){const b=M,I=M+1,A=M+2;r=na(this,l,t,i,d,m,_,b,I,A),r&&(r.faceIndex=Math.floor(M/3),e.push(r))}}}}function y_(s,t,e,i,r,a,l,h){let u;if(t.side===zn?u=i.intersectTriangle(l,a,r,!0,h):u=i.intersectTriangle(r,a,l,t.side===es,h),u===null)return null;ea.copy(h),ea.applyMatrix4(s.matrixWorld);const d=e.ray.origin.distanceTo(ea);return d<e.near||d>e.far?null:{distance:d,point:ea.clone(),object:s}}function na(s,t,e,i,r,a,l,h,u,d){s.getVertexPosition(h,Jo),s.getVertexPosition(u,Qo),s.getVertexPosition(d,jo);const m=y_(s,t,e,i,Jo,Qo,jo,Uu);if(m){const _=new nt;fi.getBarycoord(Uu,Jo,Qo,jo,_),r&&(m.uv=fi.getInterpolatedAttribute(r,h,u,d,_,new le)),a&&(m.uv1=fi.getInterpolatedAttribute(a,h,u,d,_,new le)),l&&(m.normal=fi.getInterpolatedAttribute(l,h,u,d,_,new nt),m.normal.dot(i.direction)>0&&m.normal.multiplyScalar(-1));const p={a:h,b:u,c:d,normal:new nt,materialIndex:0};fi.getNormal(Jo,Qo,jo,p.normal),m.face=p,m.barycoord=_}return m}class yf extends En{constructor(t=null,e=1,i=1,r,a,l,h,u,d=rn,m=rn,_,p){super(null,l,h,u,d,m,r,a,_,p),this.isDataTexture=!0,this.image={data:t,width:e,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Ou extends xn{constructor(t,e,i,r=1){super(t,e,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const ur=new Ae,zu=new Ae,ia=[],Bu=new ys,S_=new Ae,Wr=new pe,Xr=new Ar;class ji extends pe{constructor(t,e,i){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Ou(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,S_)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new ys),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,ur),Bu.copy(t.boundingBox).applyMatrix4(ur),this.boundingBox.union(Bu)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ar),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<e;i++)this.getMatrixAt(i,ur),Xr.copy(t.boundingSphere).applyMatrix4(ur),this.boundingSphere.union(Xr)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),this.morphTexture=t.morphTexture!==null?t.morphTexture.clone():null,this.instanceColor=t.instanceColor!==null?t.instanceColor.clone():null,this.count=t.count,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const i=e.morphTargetInfluences,r=this.morphTexture.source.data.data,a=i.length+1,l=t*a+1;for(let h=0;h<i.length;h++)i[h]=r[l+h]}raycast(t,e){const i=this.matrixWorld,r=this.count;if(Wr.geometry=this.geometry,Wr.material=this.material,Wr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Xr.copy(this.boundingSphere),Xr.applyMatrix4(i),t.ray.intersectsSphere(Xr)!==!1))for(let a=0;a<r;a++){this.getMatrixAt(a,ur),zu.multiplyMatrices(i,ur),Wr.matrixWorld=zu,Wr.raycast(t,ia);for(let l=0,h=ia.length;l<h;l++){const u=ia[l];u.instanceId=a,u.object=this,e.push(u)}ia.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Ou(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const i=e.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new yf(new Float32Array(r*this.count),r,this.count,th,pi));const a=this.morphTexture.source.data.data;let l=0;for(let d=0;d<i.length;d++)l+=i[d];const h=this.geometry.morphTargetsRelative?1:1-l,u=r*t;return a[u]=h,a.set(i,u+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Cs=new Ar,w_=new le(.5,.5),sa=new nt;class mo{constructor(t=new hs,e=new hs,i=new hs,r=new hs,a=new hs,l=new hs){this.planes=[t,e,i,r,a,l]}set(t,e,i,r,a,l){const h=this.planes;return h[0].copy(t),h[1].copy(e),h[2].copy(i),h[3].copy(r),h[4].copy(a),h[5].copy(l),this}copy(t){const e=this.planes;for(let i=0;i<6;i++)e[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,e=mi,i=!1){const r=this.planes,a=t.elements,l=a[0],h=a[1],u=a[2],d=a[3],m=a[4],_=a[5],p=a[6],g=a[7],y=a[8],w=a[9],M=a[10],v=a[11],b=a[12],I=a[13],A=a[14],D=a[15];if(r[0].setComponents(d-l,g-m,v-y,D-b).normalize(),r[1].setComponents(d+l,g+m,v+y,D+b).normalize(),r[2].setComponents(d+h,g+_,v+w,D+I).normalize(),r[3].setComponents(d-h,g-_,v-w,D-I).normalize(),i)r[4].setComponents(u,p,M,A).normalize(),r[5].setComponents(d-u,g-p,v-M,D-A).normalize();else if(r[4].setComponents(d-u,g-p,v-M,D-A).normalize(),e===mi)r[5].setComponents(d+u,g+p,v+M,D+A).normalize();else if(e===uo)r[5].setComponents(u,p,M,A).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Cs.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Cs.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Cs)}intersectsSprite(t){Cs.center.set(0,0,0);const e=w_.distanceTo(t.center);return Cs.radius=.7071067811865476+e,Cs.applyMatrix4(t.matrixWorld),this.intersectsSphere(Cs)}intersectsSphere(t){const e=this.planes,i=t.center,r=-t.radius;for(let a=0;a<6;a++)if(e[a].distanceToPoint(i)<r)return!1;return!0}intersectsBox(t){const e=this.planes;for(let i=0;i<6;i++){const r=e[i];if(sa.x=r.normal.x>0?t.max.x:t.min.x,sa.y=r.normal.y>0?t.max.y:t.min.y,sa.z=r.normal.z>0?t.max.z:t.min.z,r.distanceToPoint(sa)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let i=0;i<6;i++)if(e[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}const ku=new Ae;class hh{constructor(){this.coordinateSystem=mi,this._frustums=[],this._count=0}setFromArrayCamera(t){const e=t.cameras,i=this._frustums;for(let r=0;r<e.length;r++){const a=e[r];ku.multiplyMatrices(a.projectionMatrix,a.matrixWorldInverse),i[r]===void 0&&(i[r]=new mo),i[r].setFromProjectionMatrix(ku,a.coordinateSystem,a.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){const e=this._frustums;for(let i=0;i<this._count;i++)if(e[i].intersectsObject(t))return!0;return!1}intersectsSprite(t){const e=this._frustums;for(let i=0;i<this._count;i++)if(e[i].intersectsSprite(t))return!0;return!1}intersectsSphere(t){const e=this._frustums;for(let i=0;i<this._count;i++)if(e[i].intersectsSphere(t))return!0;return!1}intersectsBox(t){const e=this._frustums;for(let i=0;i<this._count;i++)if(e[i].intersectsBox(t))return!0;return!1}containsPoint(t){const e=this._frustums;for(let i=0;i<this._count;i++)if(e[i].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;const e=this._frustums,i=t._frustums;for(let r=0;r<t._count;r++)e[r]===void 0&&(e[r]=new mo),e[r].copy(i[r]);return this._count=t._count,this}clone(){return new hh().copy(this)}}class Sf extends Rr{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Qt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Hu=new Ae,Fc=new ch,ra=new Ar,oa=new nt;class b_ extends vn{constructor(t=new yn,e=new Sf){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const i=this.geometry,r=this.matrixWorld,a=t.params.Points.threshold,l=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ra.copy(i.boundingSphere),ra.applyMatrix4(r),ra.radius+=a,t.ray.intersectsSphere(ra)===!1)return;Hu.copy(r).invert(),Fc.copy(t.ray).applyMatrix4(Hu);const h=a/((this.scale.x+this.scale.y+this.scale.z)/3),u=h*h,d=i.index,_=i.attributes.position;if(d!==null){const p=Math.max(0,l.start),g=Math.min(d.count,l.start+l.count);for(let y=p,w=g;y<w;y++){const M=d.getX(y);oa.fromBufferAttribute(_,M),Gu(oa,M,u,r,t,e,this)}}else{const p=Math.max(0,l.start),g=Math.min(_.count,l.start+l.count);for(let y=p,w=g;y<w;y++)oa.fromBufferAttribute(_,y),Gu(oa,y,u,r,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,i=Object.keys(e);if(i.length>0){const r=e[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,l=r.length;a<l;a++){const h=r[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[h]=a}}}}}function Gu(s,t,e,i,r,a,l){const h=Fc.distanceSqToPoint(s);if(h<e){const u=new nt;Fc.closestPointToPoint(s,u),u.applyMatrix4(i);const d=r.ray.origin.distanceTo(u);if(d<r.near||d>r.far)return;a.push({distance:d,distanceToRay:Math.sqrt(h),point:u,index:t,face:null,faceIndex:null,barycoord:null,object:l})}}class wf extends En{constructor(t=[],e=yr,i,r,a,l,h,u,d,m){super(t,e,i,r,a,l,h,u,d,m),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class za extends En{constructor(t,e,i,r,a,l,h,u,d){super(t,e,i,r,a,l,h,u,d),this.isCanvasTexture=!0,this.needsUpdate=!0}}class wr extends En{constructor(t,e,i=Ci,r,a,l,h=rn,u=rn,d,m=vs,_=1){if(m!==vs&&m!==fs)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const p={width:t,height:e,depth:_};super(p,r,a,l,h,u,m,i,d),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new oh(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}}class bf extends wr{constructor(t,e=Ci,i=yr,r,a,l=rn,h=rn,u,d=vs){const m={width:t,height:t,depth:1},_=[m,m,m,m,m,m];super(t,t,e,i,r,a,l,h,u,d),this.image=_,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Ef extends En{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class Un extends yn{constructor(t=1,e=1,i=1,r=1,a=1,l=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:i,widthSegments:r,heightSegments:a,depthSegments:l};const h=this;r=Math.floor(r),a=Math.floor(a),l=Math.floor(l);const u=[],d=[],m=[],_=[];let p=0,g=0;y("z","y","x",-1,-1,i,e,t,l,a,0),y("z","y","x",1,-1,i,e,-t,l,a,1),y("x","z","y",1,1,t,i,e,r,l,2),y("x","z","y",1,-1,t,i,-e,r,l,3),y("x","y","z",1,-1,t,e,i,r,a,4),y("x","y","z",-1,-1,t,e,-i,r,a,5),this.setIndex(u),this.setAttribute("position",new Mn(d,3)),this.setAttribute("normal",new Mn(m,3)),this.setAttribute("uv",new Mn(_,2));function y(w,M,v,b,I,A,D,E,x,T,H){const F=A/x,k=D/T,G=A/2,W=D/2,z=E/2,j=x+1,rt=T+1;let $=0,st=0;const tt=new nt;for(let Y=0;Y<rt;Y++){const lt=Y*k-W;for(let St=0;St<j;St++){const Dt=St*F-G;tt[w]=Dt*b,tt[M]=lt*I,tt[v]=z,d.push(tt.x,tt.y,tt.z),tt[w]=0,tt[M]=0,tt[v]=E>0?1:-1,m.push(tt.x,tt.y,tt.z),_.push(St/x),_.push(1-Y/T),$+=1}}for(let Y=0;Y<T;Y++)for(let lt=0;lt<x;lt++){const St=p+lt+j*Y,Dt=p+lt+j*(Y+1),J=p+(lt+1)+j*(Y+1),Mt=p+(lt+1)+j*Y;u.push(St,Dt,Mt),u.push(Dt,J,Mt),st+=6}h.addGroup(g,st,H),g+=st,p+=$}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Un(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class ni extends yn{constructor(t=1,e=1,i=1,r=32,a=1,l=!1,h=0,u=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:i,radialSegments:r,heightSegments:a,openEnded:l,thetaStart:h,thetaLength:u};const d=this;r=Math.floor(r),a=Math.floor(a);const m=[],_=[],p=[],g=[];let y=0;const w=[],M=i/2;let v=0;b(),l===!1&&(t>0&&I(!0),e>0&&I(!1)),this.setIndex(m),this.setAttribute("position",new Mn(_,3)),this.setAttribute("normal",new Mn(p,3)),this.setAttribute("uv",new Mn(g,2));function b(){const A=new nt,D=new nt;let E=0;const x=(e-t)/i;for(let T=0;T<=a;T++){const H=[],F=T/a,k=F*(e-t)+t;for(let G=0;G<=r;G++){const W=G/r,z=W*u+h,j=Math.sin(z),rt=Math.cos(z);D.x=k*j,D.y=-F*i+M,D.z=k*rt,_.push(D.x,D.y,D.z),A.set(j,x,rt).normalize(),p.push(A.x,A.y,A.z),g.push(W,1-F),H.push(y++)}w.push(H)}for(let T=0;T<r;T++)for(let H=0;H<a;H++){const F=w[H][T],k=w[H+1][T],G=w[H+1][T+1],W=w[H][T+1];(t>0||H!==0)&&(m.push(F,k,W),E+=3),(e>0||H!==a-1)&&(m.push(k,G,W),E+=3)}d.addGroup(v,E,0),v+=E}function I(A){const D=y,E=new le,x=new nt;let T=0;const H=A===!0?t:e,F=A===!0?1:-1;for(let G=1;G<=r;G++)_.push(0,M*F,0),p.push(0,F,0),g.push(.5,.5),y++;const k=y;for(let G=0;G<=r;G++){const z=G/r*u+h,j=Math.cos(z),rt=Math.sin(z);x.x=H*rt,x.y=M*F,x.z=H*j,_.push(x.x,x.y,x.z),p.push(0,F,0),E.x=j*.5+.5,E.y=rt*.5*F+.5,g.push(E.x,E.y),y++}for(let G=0;G<r;G++){const W=D+G,z=k+G;A===!0?m.push(z,z+1,W):m.push(z+1,z,W),T+=3}d.addGroup(v,T,A===!0?1:2),v+=T}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ni(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Pr extends ni{constructor(t=1,e=1,i=32,r=1,a=!1,l=0,h=Math.PI*2){super(0,t,e,i,r,a,l,h),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:i,heightSegments:r,openEnded:a,thetaStart:l,thetaLength:h}}static fromJSON(t){return new Pr(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class uh extends yn{constructor(t=[],e=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:i,detail:r};const a=[],l=[];h(r),d(i),m(),this.setAttribute("position",new Mn(a,3)),this.setAttribute("normal",new Mn(a.slice(),3)),this.setAttribute("uv",new Mn(l,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function h(b){const I=new nt,A=new nt,D=new nt;for(let E=0;E<e.length;E+=3)g(e[E+0],I),g(e[E+1],A),g(e[E+2],D),u(I,A,D,b)}function u(b,I,A,D){const E=D+1,x=[];for(let T=0;T<=E;T++){x[T]=[];const H=b.clone().lerp(A,T/E),F=I.clone().lerp(A,T/E),k=E-T;for(let G=0;G<=k;G++)G===0&&T===E?x[T][G]=H:x[T][G]=H.clone().lerp(F,G/k)}for(let T=0;T<E;T++)for(let H=0;H<2*(E-T)-1;H++){const F=Math.floor(H/2);H%2===0?(p(x[T][F+1]),p(x[T+1][F]),p(x[T][F])):(p(x[T][F+1]),p(x[T+1][F+1]),p(x[T+1][F]))}}function d(b){const I=new nt;for(let A=0;A<a.length;A+=3)I.x=a[A+0],I.y=a[A+1],I.z=a[A+2],I.normalize().multiplyScalar(b),a[A+0]=I.x,a[A+1]=I.y,a[A+2]=I.z}function m(){const b=new nt;for(let I=0;I<a.length;I+=3){b.x=a[I+0],b.y=a[I+1],b.z=a[I+2];const A=M(b)/2/Math.PI+.5,D=v(b)/Math.PI+.5;l.push(A,1-D)}y(),_()}function _(){for(let b=0;b<l.length;b+=6){const I=l[b+0],A=l[b+2],D=l[b+4],E=Math.max(I,A,D),x=Math.min(I,A,D);E>.9&&x<.1&&(I<.2&&(l[b+0]+=1),A<.2&&(l[b+2]+=1),D<.2&&(l[b+4]+=1))}}function p(b){a.push(b.x,b.y,b.z)}function g(b,I){const A=b*3;I.x=t[A+0],I.y=t[A+1],I.z=t[A+2]}function y(){const b=new nt,I=new nt,A=new nt,D=new nt,E=new le,x=new le,T=new le;for(let H=0,F=0;H<a.length;H+=9,F+=6){b.set(a[H+0],a[H+1],a[H+2]),I.set(a[H+3],a[H+4],a[H+5]),A.set(a[H+6],a[H+7],a[H+8]),E.set(l[F+0],l[F+1]),x.set(l[F+2],l[F+3]),T.set(l[F+4],l[F+5]),D.copy(b).add(I).add(A).divideScalar(3);const k=M(D);w(E,F+0,b,k),w(x,F+2,I,k),w(T,F+4,A,k)}}function w(b,I,A,D){D<0&&b.x===1&&(l[I]=b.x-1),A.x===0&&A.z===0&&(l[I]=D/2/Math.PI+.5)}function M(b){return Math.atan2(b.z,-b.x)}function v(b){return Math.atan2(-b.y,Math.sqrt(b.x*b.x+b.z*b.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new uh(t.vertices,t.indices,t.radius,t.detail)}}class Ba extends uh{constructor(t=1,e=0){const i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],a=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,a,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Ba(t.radius,t.detail)}}class ii extends yn{constructor(t=1,e=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:i,heightSegments:r};const a=t/2,l=e/2,h=Math.floor(i),u=Math.floor(r),d=h+1,m=u+1,_=t/h,p=e/u,g=[],y=[],w=[],M=[];for(let v=0;v<m;v++){const b=v*p-l;for(let I=0;I<d;I++){const A=I*_-a;y.push(A,-b,0),w.push(0,0,1),M.push(I/h),M.push(1-v/u)}}for(let v=0;v<u;v++)for(let b=0;b<h;b++){const I=b+d*v,A=b+d*(v+1),D=b+1+d*(v+1),E=b+1+d*v;g.push(I,A,E),g.push(A,D,E)}this.setIndex(g),this.setAttribute("position",new Mn(y,3)),this.setAttribute("normal",new Mn(w,3)),this.setAttribute("uv",new Mn(M,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new ii(t.width,t.height,t.widthSegments,t.heightSegments)}}class dh extends yn{constructor(t=1,e=32,i=16,r=0,a=Math.PI*2,l=0,h=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:i,phiStart:r,phiLength:a,thetaStart:l,thetaLength:h},e=Math.max(3,Math.floor(e)),i=Math.max(2,Math.floor(i));const u=Math.min(l+h,Math.PI);let d=0;const m=[],_=new nt,p=new nt,g=[],y=[],w=[],M=[];for(let v=0;v<=i;v++){const b=[],I=v/i,A=l+I*h,D=t*Math.cos(A),E=Math.sqrt(t*t-D*D);let x=0;v===0&&l===0?x=.5/e:v===i&&u===Math.PI&&(x=-.5/e);for(let T=0;T<=e;T++){const H=T/e,F=r+H*a;_.x=-E*Math.cos(F),_.y=D,_.z=E*Math.sin(F),y.push(_.x,_.y,_.z),p.copy(_).normalize(),w.push(p.x,p.y,p.z),M.push(H+x,1-I),b.push(d++)}m.push(b)}for(let v=0;v<i;v++)for(let b=0;b<e;b++){const I=m[v][b+1],A=m[v][b],D=m[v+1][b],E=m[v+1][b+1];(v!==0||l>0)&&g.push(I,A,E),(v!==i-1||u<Math.PI)&&g.push(A,D,E)}this.setIndex(g),this.setAttribute("position",new Mn(y,3)),this.setAttribute("normal",new Mn(w,3)),this.setAttribute("uv",new Mn(M,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new dh(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}function br(s){const t={};for(const e in s){t[e]={};for(const i in s[e]){const r=s[e][i];if(Vu(r))r.isRenderTargetTexture?(re("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][i]=null):t[e][i]=r.clone();else if(Array.isArray(r))if(Vu(r[0])){const a=[];for(let l=0,h=r.length;l<h;l++)a[l]=r[l].clone();t[e][i]=a}else t[e][i]=r.slice();else t[e][i]=r}}return t}function Nn(s){const t={};for(let e=0;e<s.length;e++){const i=br(s[e]);for(const r in i)t[r]=i[r]}return t}function Vu(s){return s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)}function E_(s){const t=[];for(let e=0;e<s.length;e++)t.push(s[e].clone());return t}function Tf(s){const t=s.getRenderTarget();return t===null?s.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:xe.workingColorSpace}const T_={clone:br,merge:Nn};var A_=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,R_=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Ii extends Rr{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=A_,this.fragmentShader=R_,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=br(t.uniforms),this.uniformsGroups=E_(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const r in this.uniforms){const l=this.uniforms[r].value;l&&l.isTexture?e.uniforms[r]={type:"t",value:l.toJSON(t).uuid}:l&&l.isColor?e.uniforms[r]={type:"c",value:l.getHex()}:l&&l.isVector2?e.uniforms[r]={type:"v2",value:l.toArray()}:l&&l.isVector3?e.uniforms[r]={type:"v3",value:l.toArray()}:l&&l.isVector4?e.uniforms[r]={type:"v4",value:l.toArray()}:l&&l.isMatrix3?e.uniforms[r]={type:"m3",value:l.toArray()}:l&&l.isMatrix4?e.uniforms[r]={type:"m4",value:l.toArray()}:e.uniforms[r]={value:l}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(e.extensions=i),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const i in t.uniforms){const r=t.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=e[r.value]||null;break;case"c":this.uniforms[i].value=new Qt().setHex(r.value);break;case"v2":this.uniforms[i].value=new le().fromArray(r.value);break;case"v3":this.uniforms[i].value=new nt().fromArray(r.value);break;case"v4":this.uniforms[i].value=new Ze().fromArray(r.value);break;case"m3":this.uniforms[i].value=new oe().fromArray(r.value);break;case"m4":this.uniforms[i].value=new Ae().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class P_ extends Ii{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class qe extends Rr{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Qt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Qt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Nc,this.normalScale=new le(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new xs,this.combine=Kc,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class C_ extends Rr{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Rm,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class L_ extends Rr{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const zl={enabled:!1,files:{},add:function(s,t){this.enabled!==!1&&(Wu(s)||(this.files[s]=t))},get:function(s){if(this.enabled!==!1&&!Wu(s))return this.files[s]},remove:function(s){delete this.files[s]},clear:function(){this.files={}}};function Wu(s){try{const t=s.slice(s.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}class I_{constructor(t,e,i){const r=this;let a=!1,l=0,h=0,u;const d=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=i,this._abortController=null,this.itemStart=function(m){h++,a===!1&&r.onStart!==void 0&&r.onStart(m,l,h),a=!0},this.itemEnd=function(m){l++,r.onProgress!==void 0&&r.onProgress(m,l,h),l===h&&(a=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(m){r.onError!==void 0&&r.onError(m)},this.resolveURL=function(m){return m=m.normalize("NFC"),u?u(m):m},this.setURLModifier=function(m){return u=m,this},this.addHandler=function(m,_){return d.push(m,_),this},this.removeHandler=function(m){const _=d.indexOf(m);return _!==-1&&d.splice(_,2),this},this.getHandler=function(m){for(let _=0,p=d.length;_<p;_+=2){const g=d[_],y=d[_+1];if(g.global&&(g.lastIndex=0),g.test(m))return y}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const D_=new I_;class fh{constructor(t){this.manager=t!==void 0?t:D_,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){const i=this;return new Promise(function(r,a){i.load(t,r,e,a)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}}fh.DEFAULT_MATERIAL_NAME="__DEFAULT";const dr=new WeakMap;class N_ extends fh{constructor(t){super(t)}load(t,e,i,r){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const a=this,l=zl.get(`image:${t}`);if(l!==void 0){if(l.complete===!0)a.manager.itemStart(t),setTimeout(function(){e&&e(l),a.manager.itemEnd(t)},0);else{let _=dr.get(l);_===void 0&&(_=[],dr.set(l,_)),_.push({onLoad:e,onError:r})}return l}const h=fo("img");function u(){m(),e&&e(this);const _=dr.get(this)||[];for(let p=0;p<_.length;p++){const g=_[p];g.onLoad&&g.onLoad(this)}dr.delete(this),a.manager.itemEnd(t)}function d(_){m(),r&&r(_),zl.remove(`image:${t}`);const p=dr.get(this)||[];for(let g=0;g<p.length;g++){const y=p[g];y.onError&&y.onError(_)}dr.delete(this),a.manager.itemError(t),a.manager.itemEnd(t)}function m(){h.removeEventListener("load",u,!1),h.removeEventListener("error",d,!1)}return h.addEventListener("load",u,!1),h.addEventListener("error",d,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(h.crossOrigin=this.crossOrigin),zl.add(`image:${t}`,h),a.manager.itemStart(t),h.fetchPriority=this.priority,h.src=t,h}}class F_ extends fh{constructor(t){super(t)}load(t,e,i,r){const a=new En,l=new N_(this.manager);return l.setPriority(this.priority),l.setCache(this.cache),l.setCrossOrigin(this.crossOrigin),l.setPath(this.path),l.load(t,function(h){a.image=h,a.needsUpdate=!0,e!==void 0&&e(a)},i,r),a}}class ph extends vn{static registerNode(t){this.prototype._lightNode=t}constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Qt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class U_ extends ph{constructor(t,e,i){super(t,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(vn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Qt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const Bl=new Ae,Xu=new nt,Zu=new nt;class O_{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new le(512,512),this.mapType=Yn,this.map=null,this.mapPass=null,this.matrix=new Ae,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new mo,this._frameExtents=new le(1,1),this._viewportCount=1,this._viewports=[new Ze(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera;Xu.setFromMatrixPosition(t.matrixWorld),e.position.copy(Xu),Zu.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Zu),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,i,r){Bl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),i.setFromProjectionMatrix(Bl,t.coordinateSystem,t.reversedDepth);const a=this._frameExtents,l=r?r.z/a.x:1,h=r?r.w/a.y:1,u=r?r.x/a.x:0,d=r?r.y/a.y:0;t.coordinateSystem===uo||t.reversedDepth?e.set(.5*l,0,0,.5*l+u,0,.5*h,0,.5*h+d,0,0,1,0,0,0,0,1):e.set(.5*l,0,0,.5*l+u,0,.5*h,0,.5*h+d,0,0,.5,.5,0,0,0,1),e.multiply(Bl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const aa=new nt,la=new Kn,wi=new nt;class Af extends vn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Ae,this.projectionMatrix=new Ae,this.projectionMatrixInverse=new Ae,this.coordinateSystem=mi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(aa,la,wi),wi.x===1&&wi.y===1&&wi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(aa,la,wi.set(1,1,1)).invert()}updateWorldMatrix(t,e,i=!1){super.updateWorldMatrix(t,e,i),this.matrixWorld.decompose(aa,la,wi),wi.x===1&&wi.y===1&&wi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(aa,la,wi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const cs=new nt,qu=new le,$u=new le;class ui extends Af{constructor(t=50,e=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=po*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(eo*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return po*2*Math.atan(Math.tan(eo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,i){cs.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(cs.x,cs.y).multiplyScalar(-t/cs.z),cs.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(cs.x,cs.y).multiplyScalar(-t/cs.z)}getViewSize(t,e){return this.getViewBounds(t,qu,$u),e.subVectors($u,qu)}setViewOffset(t,e,i,r,a,l){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=l,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(eo*.5*this.fov)/this.zoom,i=2*e,r=this.aspect*i,a=-.5*r;const l=this.view;if(this.view!==null&&this.view.enabled){const u=l.fullWidth,d=l.fullHeight;a+=l.offsetX*r/u,e-=l.offsetY*i/d,r*=l.width/u,i*=l.height/d}const h=this.filmOffset;h!==0&&(a+=t*h/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+r,e,e-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class mh extends Af{constructor(t=-1,e=1,i=1,r=-1,a=.1,l=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=i,this.bottom=r,this.near=a,this.far=l,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,i,r,a,l){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=i,this.view.offsetY=r,this.view.width=a,this.view.height=l,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let a=i-t,l=i+t,h=r+e,u=r-e;if(this.view!==null&&this.view.enabled){const d=(this.right-this.left)/this.view.fullWidth/this.zoom,m=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=d*this.view.offsetX,l=a+d*this.view.width,h-=m*this.view.offsetY,u=h-m*this.view.height}this.projectionMatrix.makeOrthographic(a,l,h,u,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class z_ extends O_{constructor(){super(new mh(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class B_ extends ph{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(vn.DEFAULT_UP),this.updateMatrix(),this.target=new vn,this.shadow=new z_}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}class k_ extends ph{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}const fr=-90,pr=1;class Uc extends vn{constructor(t,e,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new ui(fr,pr,t,e);r.layers=this.layers,this.add(r);const a=new ui(fr,pr,t,e);a.layers=this.layers,this.add(a);const l=new ui(fr,pr,t,e);l.layers=this.layers,this.add(l);const h=new ui(fr,pr,t,e);h.layers=this.layers,this.add(h);const u=new ui(fr,pr,t,e);u.layers=this.layers,this.add(u);const d=new ui(fr,pr,t,e);d.layers=this.layers,this.add(d)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[i,r,a,l,h,u]=e;for(const d of e)this.remove(d);if(t===mi)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),l.up.set(0,0,1),l.lookAt(0,-1,0),h.up.set(0,1,0),h.lookAt(0,0,1),u.up.set(0,1,0),u.lookAt(0,0,-1);else if(t===uo)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),l.up.set(0,0,-1),l.lookAt(0,-1,0),h.up.set(0,-1,0),h.lookAt(0,0,1),u.up.set(0,-1,0),u.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const d of e)this.add(d),d.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[a,l,h,u,d,m]=this.children,_=t.getRenderTarget(),p=t.getActiveCubeFace(),g=t.getActiveMipmapLevel(),y=t.xr.enabled;t.xr.enabled=!1;const w=i.texture.mipmapsAutoUpdate;i.texture.mipmapsAutoUpdate=!1;let M=!1;t.isWebGLRenderer===!0?M=t.state.buffers.depth.getReversed():M=t.reversedDepthBuffer,t.setRenderTarget(i,0,r),M&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(i,1,r),M&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(i,2,r),M&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(i,3,r),M&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(i,4,r),M&&t.autoClear===!1&&t.clearDepth(),t.render(e,d),i.texture.mipmapsAutoUpdate=w,t.setRenderTarget(i,5,r),M&&t.autoClear===!1&&t.clearDepth(),t.render(e,m),t.setRenderTarget(_,p,g),t.xr.enabled=y,i.texture.needsPMREMUpdate=!0}}class H_ extends ui{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}}const Yu=new Ae;class G_{constructor(t,e,i=0,r=1/0){this.ray=new ch(t,e),this.near=i,this.far=r,this.camera=null,this.layers=new ah,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):Te("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Yu.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Yu),this}intersectObject(t,e=!0,i=[]){return Oc(t,this,i,e),i.sort(Ku),i}intersectObjects(t,e=!0,i=[]){for(let r=0,a=t.length;r<a;r++)Oc(t[r],this,i,e);return i.sort(Ku),i}}function Ku(s,t){return s.distance-t.distance}function Oc(s,t,e,i){let r=!0;if(s.layers.test(t.layers)&&s.raycast(t,e)===!1&&(r=!1),r===!0&&i===!0){const a=s.children;for(let l=0,h=a.length;l<h;l++)Oc(a[l],t,e,!0)}}function Ju(s,t,e,i){const r=V_(i);switch(e){case af:return s*t;case th:return s*t/r.components*r.byteLength;case eh:return s*t/r.components*r.byteLength;case Os:return s*t*2/r.components*r.byteLength;case nh:return s*t*2/r.components*r.byteLength;case lf:return s*t*3/r.components*r.byteLength;case Ai:return s*t*4/r.components*r.byteLength;case ih:return s*t*4/r.components*r.byteLength;case ga:case va:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case xa:case Ma:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case rc:case ac:return Math.max(s,16)*Math.max(t,8)/4;case sc:case oc:return Math.max(s,8)*Math.max(t,8)/2;case lc:case cc:case uc:case dc:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*8;case hc:case Ta:case fc:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case pc:return Math.floor((s+3)/4)*Math.floor((t+3)/4)*16;case mc:return Math.floor((s+4)/5)*Math.floor((t+3)/4)*16;case _c:return Math.floor((s+4)/5)*Math.floor((t+4)/5)*16;case gc:return Math.floor((s+5)/6)*Math.floor((t+4)/5)*16;case vc:return Math.floor((s+5)/6)*Math.floor((t+5)/6)*16;case xc:return Math.floor((s+7)/8)*Math.floor((t+4)/5)*16;case Mc:return Math.floor((s+7)/8)*Math.floor((t+5)/6)*16;case yc:return Math.floor((s+7)/8)*Math.floor((t+7)/8)*16;case Sc:return Math.floor((s+9)/10)*Math.floor((t+4)/5)*16;case wc:return Math.floor((s+9)/10)*Math.floor((t+5)/6)*16;case bc:return Math.floor((s+9)/10)*Math.floor((t+7)/8)*16;case Ec:return Math.floor((s+9)/10)*Math.floor((t+9)/10)*16;case Tc:return Math.floor((s+11)/12)*Math.floor((t+9)/10)*16;case Ac:return Math.floor((s+11)/12)*Math.floor((t+11)/12)*16;case Rc:case Pc:case Cc:return Math.ceil(s/4)*Math.ceil(t/4)*16;case Lc:case Ic:return Math.ceil(s/4)*Math.ceil(t/4)*8;case Aa:case Dc:return Math.ceil(s/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function V_(s){switch(s){case Yn:case nf:return{byteLength:1,components:1};case co:case sf:case Li:return{byteLength:2,components:1};case Qc:case jc:return{byteLength:2,components:4};case Ci:case Jc:case pi:return{byteLength:4,components:1};case rf:case of:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${s}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Yc}}));typeof window<"u"&&(window.__THREE__?re("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Yc);function Rf(){let s=null,t=!1,e=null,i=null;function r(a,l){i=s.requestAnimationFrame(r),e(a,l)}return{start:function(){t!==!0&&e!==null&&s!==null&&(i=s.requestAnimationFrame(r),t=!0)},stop:function(){s!==null&&s.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){e=a},setContext:function(a){s=a}}}function W_(s){const t=new WeakMap;function e(h,u){const d=h.array,m=h.usage,_=d.byteLength,p=s.createBuffer();s.bindBuffer(u,p),s.bufferData(u,d,m),h.onUploadCallback();let g;if(d instanceof Float32Array)g=s.FLOAT;else if(typeof Float16Array<"u"&&d instanceof Float16Array)g=s.HALF_FLOAT;else if(d instanceof Uint16Array)h.isFloat16BufferAttribute?g=s.HALF_FLOAT:g=s.UNSIGNED_SHORT;else if(d instanceof Int16Array)g=s.SHORT;else if(d instanceof Uint32Array)g=s.UNSIGNED_INT;else if(d instanceof Int32Array)g=s.INT;else if(d instanceof Int8Array)g=s.BYTE;else if(d instanceof Uint8Array)g=s.UNSIGNED_BYTE;else if(d instanceof Uint8ClampedArray)g=s.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+d);return{buffer:p,type:g,bytesPerElement:d.BYTES_PER_ELEMENT,version:h.version,size:_}}function i(h,u,d){const m=u.array,_=u.updateRanges;if(s.bindBuffer(d,h),_.length===0)s.bufferSubData(d,0,m);else{_.sort((g,y)=>g.start-y.start);let p=0;for(let g=1;g<_.length;g++){const y=_[p],w=_[g];w.start<=y.start+y.count+1?y.count=Math.max(y.count,w.start+w.count-y.start):(++p,_[p]=w)}_.length=p+1;for(let g=0,y=_.length;g<y;g++){const w=_[g];s.bufferSubData(d,w.start*m.BYTES_PER_ELEMENT,m,w.start,w.count)}u.clearUpdateRanges()}u.onUploadCallback()}function r(h){return h.isInterleavedBufferAttribute&&(h=h.data),t.get(h)}function a(h){h.isInterleavedBufferAttribute&&(h=h.data);const u=t.get(h);u&&(s.deleteBuffer(u.buffer),t.delete(h))}function l(h,u){if(h.isInterleavedBufferAttribute&&(h=h.data),h.isGLBufferAttribute){const m=t.get(h);(!m||m.version<h.version)&&t.set(h,{buffer:h.buffer,type:h.type,bytesPerElement:h.elementSize,version:h.version});return}const d=t.get(h);if(d===void 0)t.set(h,e(h,u));else if(d.version<h.version){if(d.size!==h.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(d.buffer,h,u),d.version=h.version}}return{get:r,remove:a,update:l}}var X_=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Z_=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,q_=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,$_=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Y_=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,K_=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,J_=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Q_=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,j_=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,tg=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,eg=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ng=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,ig=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,sg=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,rg=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,og=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ag=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,lg=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,cg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,hg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ug=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,dg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,fg=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,pg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,mg=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,_g=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,gg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,vg=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,xg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Mg="gl_FragColor = linearToOutputTexel( gl_FragColor );",yg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Sg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,wg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,bg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Eg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Tg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ag=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Rg=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Pg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Cg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Lg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Ig=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Dg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Ng=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Fg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Ug=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Og=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,zg=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Bg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,kg=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Hg=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Gg=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Vg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Wg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Xg=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Zg=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,qg=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,$g=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Yg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Kg=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Jg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Qg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,jg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,t0=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,e0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,n0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,i0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,s0=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,r0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,o0=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,a0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,l0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,c0=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,h0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,u0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,d0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,f0=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,p0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,m0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,_0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,g0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,v0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,x0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,M0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,y0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,S0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,w0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,b0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,E0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,T0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,A0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,R0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,P0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,C0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,L0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,I0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,D0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,N0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,F0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,U0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,O0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,z0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,B0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,k0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,H0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,G0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,V0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const W0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,X0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Z0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,q0=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,$0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Y0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,K0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,J0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Q0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,j0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,tv=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ev=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nv=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,iv=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sv=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,rv=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ov=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,av=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lv=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,cv=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hv=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,uv=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,dv=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fv=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pv=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,mv=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,_v=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gv=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vv=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,xv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Mv=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yv=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Sv=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,wv=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,de={alphahash_fragment:X_,alphahash_pars_fragment:Z_,alphamap_fragment:q_,alphamap_pars_fragment:$_,alphatest_fragment:Y_,alphatest_pars_fragment:K_,aomap_fragment:J_,aomap_pars_fragment:Q_,batching_pars_vertex:j_,batching_vertex:tg,begin_vertex:eg,beginnormal_vertex:ng,bsdfs:ig,iridescence_fragment:sg,bumpmap_pars_fragment:rg,clipping_planes_fragment:og,clipping_planes_pars_fragment:ag,clipping_planes_pars_vertex:lg,clipping_planes_vertex:cg,color_fragment:hg,color_pars_fragment:ug,color_pars_vertex:dg,color_vertex:fg,common:pg,defaultnormal_vertex:mg,displacementmap_pars_vertex:_g,displacementmap_vertex:gg,emissivemap_fragment:vg,emissivemap_pars_fragment:xg,colorspace_fragment:Mg,colorspace_pars_fragment:yg,envmap_fragment:Sg,envmap_common_pars_fragment:wg,envmap_pars_fragment:bg,envmap_pars_vertex:Eg,envmap_physical_pars_fragment:Ug,envmap_vertex:Tg,fog_vertex:Ag,fog_pars_vertex:Rg,fog_fragment:Pg,fog_pars_fragment:Cg,gradientmap_pars_fragment:Lg,lightmap_pars_fragment:Ig,lights_lambert_fragment:Dg,lights_lambert_pars_fragment:Ng,lights_pars_begin:Fg,lights_toon_fragment:Og,lights_toon_pars_fragment:zg,lights_phong_fragment:Bg,lights_phong_pars_fragment:kg,lights_physical_fragment:Hg,lights_physical_pars_fragment:Gg,lights_fragment_begin:Vg,lights_fragment_maps:Wg,lights_fragment_end:Xg,lightprobes_pars_fragment:Zg,logdepthbuf_fragment:qg,logdepthbuf_pars_fragment:$g,logdepthbuf_pars_vertex:Yg,logdepthbuf_vertex:Kg,map_fragment:Jg,map_pars_fragment:Qg,map_particle_fragment:jg,map_particle_pars_fragment:t0,metalnessmap_fragment:e0,metalnessmap_pars_fragment:n0,morphinstance_vertex:i0,morphcolor_vertex:s0,morphnormal_vertex:r0,morphtarget_pars_vertex:o0,morphtarget_vertex:a0,normal_fragment_begin:l0,normal_fragment_maps:c0,normal_pars_fragment:h0,normal_pars_vertex:u0,normal_vertex:d0,normalmap_pars_fragment:f0,clearcoat_normal_fragment_begin:p0,clearcoat_normal_fragment_maps:m0,clearcoat_pars_fragment:_0,iridescence_pars_fragment:g0,opaque_fragment:v0,packing:x0,premultiplied_alpha_fragment:M0,project_vertex:y0,dithering_fragment:S0,dithering_pars_fragment:w0,roughnessmap_fragment:b0,roughnessmap_pars_fragment:E0,shadowmap_pars_fragment:T0,shadowmap_pars_vertex:A0,shadowmap_vertex:R0,shadowmask_pars_fragment:P0,skinbase_vertex:C0,skinning_pars_vertex:L0,skinning_vertex:I0,skinnormal_vertex:D0,specularmap_fragment:N0,specularmap_pars_fragment:F0,tonemapping_fragment:U0,tonemapping_pars_fragment:O0,transmission_fragment:z0,transmission_pars_fragment:B0,uv_pars_fragment:k0,uv_pars_vertex:H0,uv_vertex:G0,worldpos_vertex:V0,background_vert:W0,background_frag:X0,backgroundCube_vert:Z0,backgroundCube_frag:q0,cube_vert:$0,cube_frag:Y0,depth_vert:K0,depth_frag:J0,distance_vert:Q0,distance_frag:j0,equirect_vert:tv,equirect_frag:ev,linedashed_vert:nv,linedashed_frag:iv,meshbasic_vert:sv,meshbasic_frag:rv,meshlambert_vert:ov,meshlambert_frag:av,meshmatcap_vert:lv,meshmatcap_frag:cv,meshnormal_vert:hv,meshnormal_frag:uv,meshphong_vert:dv,meshphong_frag:fv,meshphysical_vert:pv,meshphysical_frag:mv,meshtoon_vert:_v,meshtoon_frag:gv,points_vert:vv,points_frag:xv,shadow_vert:Mv,shadow_frag:yv,sprite_vert:Sv,sprite_frag:wv},Bt={common:{diffuse:{value:new Qt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new oe},alphaMap:{value:null},alphaMapTransform:{value:new oe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new oe}},envmap:{envMap:{value:null},envMapRotation:{value:new oe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new oe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new oe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new oe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new oe},normalScale:{value:new le(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new oe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new oe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new oe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new oe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Qt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Qt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new oe},alphaTest:{value:0},uvTransform:{value:new oe}},sprite:{diffuse:{value:new Qt(16777215)},opacity:{value:1},center:{value:new le(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new oe},alphaMap:{value:null},alphaMapTransform:{value:new oe},alphaTest:{value:0}}},Ti={basic:{uniforms:Nn([Bt.common,Bt.specularmap,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.fog]),vertexShader:de.meshbasic_vert,fragmentShader:de.meshbasic_frag},lambert:{uniforms:Nn([Bt.common,Bt.specularmap,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.fog,Bt.lights,{emissive:{value:new Qt(0)},envMapIntensity:{value:1}}]),vertexShader:de.meshlambert_vert,fragmentShader:de.meshlambert_frag},phong:{uniforms:Nn([Bt.common,Bt.specularmap,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.fog,Bt.lights,{emissive:{value:new Qt(0)},specular:{value:new Qt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:de.meshphong_vert,fragmentShader:de.meshphong_frag},standard:{uniforms:Nn([Bt.common,Bt.envmap,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.roughnessmap,Bt.metalnessmap,Bt.fog,Bt.lights,{emissive:{value:new Qt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:de.meshphysical_vert,fragmentShader:de.meshphysical_frag},toon:{uniforms:Nn([Bt.common,Bt.aomap,Bt.lightmap,Bt.emissivemap,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.gradientmap,Bt.fog,Bt.lights,{emissive:{value:new Qt(0)}}]),vertexShader:de.meshtoon_vert,fragmentShader:de.meshtoon_frag},matcap:{uniforms:Nn([Bt.common,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,Bt.fog,{matcap:{value:null}}]),vertexShader:de.meshmatcap_vert,fragmentShader:de.meshmatcap_frag},points:{uniforms:Nn([Bt.points,Bt.fog]),vertexShader:de.points_vert,fragmentShader:de.points_frag},dashed:{uniforms:Nn([Bt.common,Bt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:de.linedashed_vert,fragmentShader:de.linedashed_frag},depth:{uniforms:Nn([Bt.common,Bt.displacementmap]),vertexShader:de.depth_vert,fragmentShader:de.depth_frag},normal:{uniforms:Nn([Bt.common,Bt.bumpmap,Bt.normalmap,Bt.displacementmap,{opacity:{value:1}}]),vertexShader:de.meshnormal_vert,fragmentShader:de.meshnormal_frag},sprite:{uniforms:Nn([Bt.sprite,Bt.fog]),vertexShader:de.sprite_vert,fragmentShader:de.sprite_frag},background:{uniforms:{uvTransform:{value:new oe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:de.background_vert,fragmentShader:de.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new oe}},vertexShader:de.backgroundCube_vert,fragmentShader:de.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:de.cube_vert,fragmentShader:de.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:de.equirect_vert,fragmentShader:de.equirect_frag},distance:{uniforms:Nn([Bt.common,Bt.displacementmap,{referencePosition:{value:new nt},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:de.distance_vert,fragmentShader:de.distance_frag},shadow:{uniforms:Nn([Bt.lights,Bt.fog,{color:{value:new Qt(0)},opacity:{value:1}}]),vertexShader:de.shadow_vert,fragmentShader:de.shadow_frag}};Ti.physical={uniforms:Nn([Ti.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new oe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new oe},clearcoatNormalScale:{value:new le(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new oe},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new oe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new oe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new oe},sheen:{value:0},sheenColor:{value:new Qt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new oe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new oe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new oe},transmissionSamplerSize:{value:new le},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new oe},attenuationDistance:{value:0},attenuationColor:{value:new Qt(0)},specularColor:{value:new Qt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new oe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new oe},anisotropyVector:{value:new le},anisotropyMap:{value:null},anisotropyMapTransform:{value:new oe}}]),vertexShader:de.meshphysical_vert,fragmentShader:de.meshphysical_frag};const ca={r:0,b:0,g:0},bv=new Ae,Pf=new oe;Pf.set(-1,0,0,0,1,0,0,0,1);function Ev(s,t,e,i,r,a){const l=new Qt(0);let h=r===!0?0:1,u,d,m=null,_=0,p=null;function g(b){let I=b.isScene===!0?b.background:null;if(I&&I.isTexture){const A=b.backgroundBlurriness>0;I=t.get(I,A)}return I}function y(b){let I=!1;const A=g(b);A===null?M(l,h):A&&A.isColor&&(M(A,1),I=!0);const D=s.xr.getEnvironmentBlendMode();D==="additive"?e.buffers.color.setClear(0,0,0,1,a):D==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,a),(s.autoClear||I)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),s.clear(s.autoClearColor,s.autoClearDepth,s.autoClearStencil))}function w(b,I){const A=g(I);A&&A.isCubeTexture?(d===void 0&&(d=new pe(new Un(1,1,1),new Ii({name:"BackgroundCubeMaterial",uniforms:br(Ti.backgroundCube.uniforms),vertexShader:Ti.backgroundCube.vertexShader,fragmentShader:Ti.backgroundCube.fragmentShader,side:zn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),d.geometry.deleteAttribute("normal"),d.geometry.deleteAttribute("uv"),d.onBeforeRender=function(D,E,x){this.matrixWorld.copyPosition(x.matrixWorld)},Object.defineProperty(d.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(d)),d.material.uniforms.envMap.value=A,d.material.uniforms.backgroundBlurriness.value=I.backgroundBlurriness,d.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,d.material.uniforms.backgroundRotation.value.setFromMatrix4(bv.makeRotationFromEuler(I.backgroundRotation)).transpose(),A.isRenderTargetTexture===!1&&d.material.uniforms.backgroundRotation.value.premultiply(Pf),d.material.toneMapped=xe.getTransfer(A.colorSpace)!==De,(m!==A||_!==A.version||p!==s.toneMapping)&&(d.material.needsUpdate=!0,m=A,_=A.version,p=s.toneMapping),d.layers.enableAll(),b.unshift(d,d.geometry,d.material,0,0,null)):A&&A.isTexture&&(u===void 0&&(u=new pe(new ii(2,2),new Ii({name:"BackgroundMaterial",uniforms:br(Ti.background.uniforms),vertexShader:Ti.background.vertexShader,fragmentShader:Ti.background.fragmentShader,side:es,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),u.geometry.deleteAttribute("normal"),Object.defineProperty(u.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(u)),u.material.uniforms.t2D.value=A,u.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,u.material.toneMapped=xe.getTransfer(A.colorSpace)!==De,A.matrixAutoUpdate===!0&&A.updateMatrix(),u.material.uniforms.uvTransform.value.copy(A.matrix),(m!==A||_!==A.version||p!==s.toneMapping)&&(u.material.needsUpdate=!0,m=A,_=A.version,p=s.toneMapping),u.layers.enableAll(),b.unshift(u,u.geometry,u.material,0,0,null))}function M(b,I){b.getRGB(ca,Tf(s)),e.buffers.color.setClear(ca.r,ca.g,ca.b,I,a)}function v(){d!==void 0&&(d.geometry.dispose(),d.material.dispose(),d=void 0),u!==void 0&&(u.geometry.dispose(),u.material.dispose(),u=void 0)}return{getClearColor:function(){return l},setClearColor:function(b,I=1){l.set(b),h=I,M(l,h)},getClearAlpha:function(){return h},setClearAlpha:function(b){h=b,M(l,h)},render:y,addToRenderList:w,dispose:v}}function Tv(s,t){const e=s.getParameter(s.MAX_VERTEX_ATTRIBS),i={},r=p(null);let a=r,l=!1;function h(k,G,W,z,j){let rt=!1;const $=_(k,z,W,G);a!==$&&(a=$,d(a.object)),rt=g(k,z,W,j),rt&&y(k,z,W,j),j!==null&&t.update(j,s.ELEMENT_ARRAY_BUFFER),(rt||l)&&(l=!1,A(k,G,W,z),j!==null&&s.bindBuffer(s.ELEMENT_ARRAY_BUFFER,t.get(j).buffer))}function u(){return s.createVertexArray()}function d(k){return s.bindVertexArray(k)}function m(k){return s.deleteVertexArray(k)}function _(k,G,W,z){const j=z.wireframe===!0;let rt=i[G.id];rt===void 0&&(rt={},i[G.id]=rt);const $=k.isInstancedMesh===!0?k.id:0;let st=rt[$];st===void 0&&(st={},rt[$]=st);let tt=st[W.id];tt===void 0&&(tt={},st[W.id]=tt);let Y=tt[j];return Y===void 0&&(Y=p(u()),tt[j]=Y),Y}function p(k){const G=[],W=[],z=[];for(let j=0;j<e;j++)G[j]=0,W[j]=0,z[j]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:G,enabledAttributes:W,attributeDivisors:z,object:k,attributes:{},index:null}}function g(k,G,W,z){const j=a.attributes,rt=G.attributes;let $=0;const st=W.getAttributes();for(const tt in st)if(st[tt].location>=0){const lt=j[tt];let St=rt[tt];if(St===void 0&&(tt==="instanceMatrix"&&k.instanceMatrix&&(St=k.instanceMatrix),tt==="instanceColor"&&k.instanceColor&&(St=k.instanceColor)),lt===void 0||lt.attribute!==St||St&&lt.data!==St.data)return!0;$++}return a.attributesNum!==$||a.index!==z}function y(k,G,W,z){const j={},rt=G.attributes;let $=0;const st=W.getAttributes();for(const tt in st)if(st[tt].location>=0){let lt=rt[tt];lt===void 0&&(tt==="instanceMatrix"&&k.instanceMatrix&&(lt=k.instanceMatrix),tt==="instanceColor"&&k.instanceColor&&(lt=k.instanceColor));const St={};St.attribute=lt,lt&&lt.data&&(St.data=lt.data),j[tt]=St,$++}a.attributes=j,a.attributesNum=$,a.index=z}function w(){const k=a.newAttributes;for(let G=0,W=k.length;G<W;G++)k[G]=0}function M(k){v(k,0)}function v(k,G){const W=a.newAttributes,z=a.enabledAttributes,j=a.attributeDivisors;W[k]=1,z[k]===0&&(s.enableVertexAttribArray(k),z[k]=1),j[k]!==G&&(s.vertexAttribDivisor(k,G),j[k]=G)}function b(){const k=a.newAttributes,G=a.enabledAttributes;for(let W=0,z=G.length;W<z;W++)G[W]!==k[W]&&(s.disableVertexAttribArray(W),G[W]=0)}function I(k,G,W,z,j,rt,$){$===!0?s.vertexAttribIPointer(k,G,W,j,rt):s.vertexAttribPointer(k,G,W,z,j,rt)}function A(k,G,W,z){w();const j=z.attributes,rt=W.getAttributes(),$=G.defaultAttributeValues;for(const st in rt){const tt=rt[st];if(tt.location>=0){let Y=j[st];if(Y===void 0&&(st==="instanceMatrix"&&k.instanceMatrix&&(Y=k.instanceMatrix),st==="instanceColor"&&k.instanceColor&&(Y=k.instanceColor)),Y!==void 0){const lt=Y.normalized,St=Y.itemSize,Dt=t.get(Y);if(Dt===void 0)continue;const J=Dt.buffer,Mt=Dt.type,yt=Dt.bytesPerElement,Wt=Mt===s.INT||Mt===s.UNSIGNED_INT||Y.gpuType===Jc;if(Y.isInterleavedBufferAttribute){const Rt=Y.data,jt=Rt.isInterleavedBuffer===!0?Rt.stride:Rt.itemSize,we=Y.offset;if(Rt.isInstancedInterleavedBuffer||Rt.isInstancedBufferAttribute){for(let Jt=0;Jt<tt.locationSize;Jt++)v(tt.location+Jt,Rt.meshPerAttribute);k.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=Rt.meshPerAttribute*Rt.count)}else for(let Jt=0;Jt<tt.locationSize;Jt++)M(tt.location+Jt);s.bindBuffer(s.ARRAY_BUFFER,J);for(let Jt=0;Jt<tt.locationSize;Jt++)I(tt.location+Jt,St/tt.locationSize,Mt,lt,jt*yt,(we+St/tt.locationSize*Jt)*yt,Wt)}else{if(Y.isInstancedBufferAttribute){for(let Rt=0;Rt<tt.locationSize;Rt++)v(tt.location+Rt,Y.meshPerAttribute);k.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=Y.meshPerAttribute*Y.count)}else for(let Rt=0;Rt<tt.locationSize;Rt++)M(tt.location+Rt);s.bindBuffer(s.ARRAY_BUFFER,J);for(let Rt=0;Rt<tt.locationSize;Rt++)I(tt.location+Rt,St/tt.locationSize,Mt,lt,St*yt,St/tt.locationSize*Rt*yt,Wt)}}else if($!==void 0){const lt=$[st];if(lt!==void 0)switch(lt.length){case 2:s.vertexAttrib2fv(tt.location,lt);break;case 3:s.vertexAttrib3fv(tt.location,lt);break;case 4:s.vertexAttrib4fv(tt.location,lt);break;default:s.vertexAttrib1fv(tt.location,lt)}}}}b()}function D(){H();for(const k in i){const G=i[k];for(const W in G){const z=G[W];for(const j in z){const rt=z[j];for(const $ in rt)m(rt[$].object),delete rt[$];delete z[j]}}delete i[k]}}function E(k){if(i[k.id]===void 0)return;const G=i[k.id];for(const W in G){const z=G[W];for(const j in z){const rt=z[j];for(const $ in rt)m(rt[$].object),delete rt[$];delete z[j]}}delete i[k.id]}function x(k){for(const G in i){const W=i[G];for(const z in W){const j=W[z];if(j[k.id]===void 0)continue;const rt=j[k.id];for(const $ in rt)m(rt[$].object),delete rt[$];delete j[k.id]}}}function T(k){for(const G in i){const W=i[G],z=k.isInstancedMesh===!0?k.id:0,j=W[z];if(j!==void 0){for(const rt in j){const $=j[rt];for(const st in $)m($[st].object),delete $[st];delete j[rt]}delete W[z],Object.keys(W).length===0&&delete i[G]}}}function H(){F(),l=!0,a!==r&&(a=r,d(a.object))}function F(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:h,reset:H,resetDefaultState:F,dispose:D,releaseStatesOfGeometry:E,releaseStatesOfObject:T,releaseStatesOfProgram:x,initAttributes:w,enableAttribute:M,disableUnusedAttributes:b}}function Av(s,t,e){let i;function r(u){i=u}function a(u,d){s.drawArrays(i,u,d),e.update(d,i,1)}function l(u,d,m){m!==0&&(s.drawArraysInstanced(i,u,d,m),e.update(d,i,m))}function h(u,d,m){if(m===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,u,0,d,0,m);let p=0;for(let g=0;g<m;g++)p+=d[g];e.update(p,i,1)}this.setMode=r,this.render=a,this.renderInstances=l,this.renderMultiDraw=h}function Rv(s,t,e,i){let r;function a(){if(r!==void 0)return r;if(t.has("EXT_texture_filter_anisotropic")===!0){const x=t.get("EXT_texture_filter_anisotropic");r=s.getParameter(x.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function l(x){return!(x!==Ai&&i.convert(x)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_FORMAT))}function h(x){const T=x===Li&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(x!==Yn&&x!==pi&&!T&&i.convert(x)!==s.getParameter(s.IMPLEMENTATION_COLOR_READ_TYPE))}function u(x){if(x==="highp"){if(s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.HIGH_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.HIGH_FLOAT).precision>0)return"highp";x="mediump"}return x==="mediump"&&s.getShaderPrecisionFormat(s.VERTEX_SHADER,s.MEDIUM_FLOAT).precision>0&&s.getShaderPrecisionFormat(s.FRAGMENT_SHADER,s.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let d=e.precision!==void 0?e.precision:"highp";const m=u(d);m!==d&&(re("WebGLRenderer:",d,"not supported, using",m,"instead."),d=m);const _=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),p=e.logarithmicDepthBuffer===!0&&_===!1;e.reversedDepthBuffer===!0&&_===!1&&re("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),e.logarithmicDepthBuffer===!0&&_===!0&&re("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");const g=s.getParameter(s.MAX_TEXTURE_IMAGE_UNITS),y=s.getParameter(s.MAX_VERTEX_TEXTURE_IMAGE_UNITS),w=s.getParameter(s.MAX_TEXTURE_SIZE),M=s.getParameter(s.MAX_CUBE_MAP_TEXTURE_SIZE),v=s.getParameter(s.MAX_VERTEX_ATTRIBS),b=s.getParameter(s.MAX_VERTEX_UNIFORM_VECTORS),I=s.getParameter(s.MAX_VARYING_VECTORS),A=s.getParameter(s.MAX_FRAGMENT_UNIFORM_VECTORS),D=s.getParameter(s.MAX_SAMPLES),E=s.getParameter(s.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:u,textureFormatReadable:l,textureTypeReadable:h,precision:d,logarithmicDepthBuffer:p,reversedDepthBuffer:_,maxTextures:g,maxVertexTextures:y,maxTextureSize:w,maxCubemapSize:M,maxAttributes:v,maxVertexUniforms:b,maxVaryings:I,maxFragmentUniforms:A,maxSamples:D,samples:E}}function Pv(s){const t=this;let e=null,i=0,r=!1,a=!1;const l=new hs,h=new oe,u={value:null,needsUpdate:!1};this.uniform=u,this.numPlanes=0,this.numIntersection=0,this.init=function(_,p){const g=_.length!==0||p||i!==0||r;return r=p,i=_.length,g},this.beginShadows=function(){a=!0,m(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(_,p){e=m(_,p,0)},this.setState=function(_,p,g){const y=_.clippingPlanes,w=_.clipIntersection,M=_.clipShadows,v=s.get(_);if(!r||y===null||y.length===0||a&&!M)a?m(null):d();else{const b=a?0:i,I=b*4;let A=v.clippingState||null;u.value=A,A=m(y,p,I,g);for(let D=0;D!==I;++D)A[D]=e[D];v.clippingState=A,this.numIntersection=w?this.numPlanes:0,this.numPlanes+=b}};function d(){u.value!==e&&(u.value=e,u.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function m(_,p,g,y){const w=_!==null?_.length:0;let M=null;if(w!==0){if(M=u.value,y!==!0||M===null){const v=g+w*4,b=p.matrixWorldInverse;h.getNormalMatrix(b),(M===null||M.length<v)&&(M=new Float32Array(v));for(let I=0,A=g;I!==w;++I,A+=4)l.copy(_[I]).applyMatrix4(b,h),l.normal.toArray(M,A),M[A+3]=l.constant}u.value=M,u.needsUpdate=!0}return t.numPlanes=w,t.numIntersection=0,M}}class _h extends vi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const i={width:t,height:t,depth:1},r=[i,i,i,i,i,i];this.texture=new wf(r),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Un(5,5,5),a=new Ii({name:"CubemapFromEquirect",uniforms:br(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:zn,blending:vr});a.uniforms.tEquirect.value=e;const l=new pe(r,a),h=e.minFilter;return e.minFilter===Ki&&(e.minFilter=On),new Uc(1,10,this).update(t,l),e.minFilter=h,l.geometry.dispose(),l.material.dispose(),this}clear(t,e=!0,i=!0,r=!0){const a=t.getRenderTarget();for(let l=0;l<6;l++)t.setRenderTarget(this,l),t.clear(e,i,r);t.setRenderTarget(a)}}const Qu=256,Cv=3,Lv=20,Cf=256,Lf=16,Iv=3,Dv=new nt,Nv=new Qt;class Pa{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new Uc(1,10,null),this._boxMesh=new pe(new Un(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,i=.1,r=100,a={}){const{size:l=256,position:h=Dv}=a,u=this._renderer;this._setSize(l);const d=this._allocateTarget(),m=this._getSourceTarget(!0);e>0&&(m.texture.mipmapsAutoUpdate=!1);const _=u.autoClear,p=u.autoClearColor,g=u.autoClearDepth,y=u.autoClearStencil,w=t.background;u.autoClear=!0,u.autoClearColor=!0,u.autoClearDepth=!0,u.autoClearStencil=!0,w===null&&(t.background=u.getClearColor(Nv));const M=new Uc(i,r,m);return M.position.copy(h),M.update(u,t),u.autoClear=_,u.autoClearColor=p,u.autoClearDepth=g,u.autoClearStencil=y,t.background=w,e>0&&(m.texture.mipmapsAutoUpdate=!0,this._blur(d,e)),this._applyPMREM(d),d}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ed(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=td(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(Qu,ff(t))}_fromTexture(t,e){t.mapping===yr||t.mapping===lo?this._setSize(t.image.length===0?Qu:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);const i=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(i),i}_allocateTarget(){const t=this._cubeSize,e=ju(t,!1,!1),i=Math.log2(t)-Cv;for(let r=0;r<=i;r++)e.texture.mipmaps.push({width:t>>r,height:t>>r});return e.texture.name="PMREM",e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){const e=this._cubeSize,i=this._sourceTarget;return(i===null||i.width!==e||t&&i.depthBuffer===!1)&&(i!==null&&i.dispose(),this._sourceTarget=ju(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,i){const r=this._boxMesh,a=this._cubeCamera;r.material=i,a.renderTarget=t,a.activeMipmapLevel=e;const l=t.width>>e;t.viewport.set(0,0,l,l),a.update(this._renderer,r),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===yr||t.mapping===lo?(this._cubemapMaterial===null&&(this._cubemapMaterial=ed()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=td()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Fv(),this._integrationMaterial=Uv());const e=this._cubeSize,i=t.texture.mipmaps.length-1,r=this._ggxMaterial.uniforms;r.envMap.value=this._sourceTarget.texture;const a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(e/Lf);for(let l=0;l<=i;l++){const h=Pa.lodToRoughness(l,i);if(l>i-Iv)a.roughness.value=h,this._renderCube(t,l,this._integrationMaterial);else{const u=h>0?Math.log2(e)+.5*Math.log2(6/(Cf*Math.pow(h,4)))+.5:0;r.roughness.value=h,r.lodBias.value=u,this._renderCube(t,l,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=Ov());const i=this._blurMaterial,r=i.uniforms,a=this._sourceTarget;r.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,r.envMap.value=a.texture,this._renderCube(t,0,i),r.envMap.value=t.texture,this._renderCube(a,0,i)}}function ju(s,t,e){return new _h(s,{minFilter:Ki,generateMipmaps:t,type:Li,colorSpace:ho,depthBuffer:e})}function yo(s,t,e){return new Ii({name:s,uniforms:t,vertexShader:de.cube_vert,fragmentShader:e,side:zn,blending:vr,depthTest:!1,depthWrite:!1})}function Fv(){return yo("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Cf}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Uv(){return yo("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Lf}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Ov(){return yo("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Lv}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function td(){return yo("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function ed(){return yo("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function zv(s){let t=new WeakMap,e=new WeakMap,i=null;function r(p,g=!1){return p==null?null:g?l(p):a(p)}function a(p){if(p&&p.isTexture){const g=p.mapping;if(g===fl||g===pl)if(t.has(p)){const y=t.get(p).texture;return h(y,p.mapping)}else{const y=p.image;if(y&&y.height>0){const w=new _h(y.height);return w.fromEquirectangularTexture(s,p),t.set(p,w),p.addEventListener("dispose",d),h(w.texture,p.mapping)}else return null}}return p}function l(p){if(p&&p.isTexture&&p.isPMREMTexture!==!0){const g=p.mapping,y=g===fl||g===pl,w=g===yr||g===lo;if(y||w){let M=e.get(p);const v=M!==void 0?M.texture.pmremVersion:0;if(p.isRenderTargetTexture&&p.pmremVersion!==v)return i===null&&(i=new Pa(s)),M=y?i.fromEquirectangular(p,M):i.fromCubemap(p,M),M.texture.pmremVersion=p.pmremVersion,e.set(p,M),M.texture;if(M!==void 0)return M.texture;{const b=p.image;return y&&b&&b.height>0||w&&b&&u(b)?(i===null&&(i=new Pa(s)),M=y?i.fromEquirectangular(p):i.fromCubemap(p),M.texture.pmremVersion=p.pmremVersion,e.set(p,M),p.addEventListener("dispose",m),M.texture):null}}}return p}function h(p,g){return g===fl?p.mapping=yr:g===pl&&(p.mapping=lo),p}function u(p){let g=0;const y=6;for(let w=0;w<y;w++)p[w]!==void 0&&g++;return g===y}function d(p){const g=p.target;g.removeEventListener("dispose",d);const y=t.get(g);y!==void 0&&(t.delete(g),y.dispose())}function m(p){const g=p.target;g.removeEventListener("dispose",m);const y=e.get(g);y!==void 0&&(e.delete(g),y.dispose())}function _(){t=new WeakMap,e=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:_}}function Bv(s){const t={};function e(i){if(t[i]!==void 0)return t[i];const r=s.getExtension(i);return t[i]=r,r}return{has:function(i){return e(i)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(i){const r=e(i);return r===null&&ya("WebGLRenderer: "+i+" extension not supported."),r}}}function kv(s,t,e,i){const r={},a=new WeakMap,l=new FinalizationRegistry(y=>delete r[y]);function h(y){u(y.target)}function u(y){y.index!==null&&t.remove(y.index);for(const M in y.attributes)t.remove(y.attributes[M]);y.removeEventListener("dispose",h),delete r[y.id],l.unregister(y);const w=a.get(y);w&&(t.remove(w),a.delete(y)),i.releaseStatesOfGeometry(y),y.isInstancedBufferGeometry===!0&&delete y._maxInstanceCount,e.memory.geometries--}function d(y,w){return r[w.id]!==void 0||(w.addEventListener("dispose",h),r[w.id]=new WeakRef(w),l.register(w,w.id,w),e.memory.geometries++),w}function m(y){const w=y.attributes;for(const M in w)t.update(w[M],s.ARRAY_BUFFER)}function _(y){const w=y.index,M=y.attributes.position;let v=0;if(M===void 0)return;const b=w!==null?w.array.length:M.array.length/3-1,I=M.count>=65535?Mf:xf,A=new I(Math.ceil(b/3)*6,1),D=A.array;if(w!==null){const x=w.array;v=w.version;for(let T=0,H=0;T<b;T+=3){const F=x[T+0],k=x[T+1],G=x[T+2];D[H++]=F,D[H++]=k,D[H++]=k,D[H++]=G,D[H++]=G,D[H++]=F}}else{v=M.version;for(let x=0,T=0;x<b;x+=3){const H=x+0,F=x+1,k=x+2;D[T++]=H,D[T++]=F,D[T++]=F,D[T++]=k,D[T++]=k,D[T++]=H}}A.version=v;const E=a.get(y);E&&t.remove(E),a.set(y,A)}function p(y){const w=a.get(y);if(w){const M=y.index;M!==null&&w.version<M.version&&_(y)}else _(y);return a.get(y)}function g(){for(const y in r){const w=r[y].deref();w!==void 0&&u(w)}}return{get:d,update:m,getWireframeAttribute:p,dispose:g}}function Hv(s,t,e){let i;function r(_){i=_}let a,l;function h(_){a=_.type,l=_.bytesPerElement}function u(_,p){s.drawElements(i,p,a,_*l),e.update(p,i,1)}function d(_,p,g){g!==0&&(s.drawElementsInstanced(i,p,a,_*l,g),e.update(p,i,g))}function m(_,p,g){if(g===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,p,0,a,_,0,g);let w=0;for(let M=0;M<g;M++)w+=p[M];e.update(w,i,1)}this.setMode=r,this.setIndex=h,this.render=u,this.renderInstances=d,this.renderMultiDraw=m}function Gv(s){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,l,h){switch(e.calls++,l){case s.TRIANGLES:e.triangles+=h*(a/3);break;case s.LINES:e.lines+=h*(a/2);break;case s.LINE_STRIP:e.lines+=h*(a-1);break;case s.LINE_LOOP:e.lines+=h*a;break;case s.POINTS:e.points+=h*a;break;default:Te("WebGLInfo: Unknown draw mode:",l);break}}function r(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:r,update:i}}function Vv(s,t,e){const i=new WeakMap,r=new Ze;function a(l,h,u){const d=l.morphTargetInfluences,m=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,_=m!==void 0?m.length:0;let p=i.get(h);if(p===void 0||p.count!==_){let F=function(){T.dispose(),i.delete(h),h.removeEventListener("dispose",F)};var g=F;p!==void 0&&p.texture.dispose();const y=h.morphAttributes.position!==void 0,w=h.morphAttributes.normal!==void 0,M=h.morphAttributes.color!==void 0,v=h.morphAttributes.position||[],b=h.morphAttributes.normal||[],I=h.morphAttributes.color||[];let A=0;y===!0&&(A=1),w===!0&&(A=2),M===!0&&(A=3);let D=h.attributes.position.count*A,E=1;D>t.maxTextureSize&&(E=Math.ceil(D/t.maxTextureSize),D=t.maxTextureSize);const x=new Float32Array(D*E*4*_),T=new _f(x,D,E,_);T.type=pi,T.needsUpdate=!0;const H=A*4;for(let k=0;k<_;k++){const G=v[k],W=b[k],z=I[k],j=D*E*4*k;for(let rt=0;rt<G.count;rt++){const $=rt*H;y===!0&&(r.fromBufferAttribute(G,rt),x[j+$+0]=r.x,x[j+$+1]=r.y,x[j+$+2]=r.z,x[j+$+3]=0),w===!0&&(r.fromBufferAttribute(W,rt),x[j+$+4]=r.x,x[j+$+5]=r.y,x[j+$+6]=r.z,x[j+$+7]=0),M===!0&&(r.fromBufferAttribute(z,rt),x[j+$+8]=r.x,x[j+$+9]=r.y,x[j+$+10]=r.z,x[j+$+11]=z.itemSize===4?r.w:1)}}p={count:_,texture:T,size:new le(D,E)},i.set(h,p),h.addEventListener("dispose",F)}if(l.isInstancedMesh===!0&&l.morphTexture!==null)u.getUniforms().setValue(s,"morphTexture",l.morphTexture,e);else{let y=0;for(let M=0;M<d.length;M++)y+=d[M];const w=h.morphTargetsRelative?1:1-y;u.getUniforms().setValue(s,"morphTargetBaseInfluence",w),u.getUniforms().setValue(s,"morphTargetInfluences",d)}u.getUniforms().setValue(s,"morphTargetsTexture",p.texture,e),u.getUniforms().setValue(s,"morphTargetsTextureSize",p.size)}return{update:a}}function Wv(s,t,e,i,r){let a=new WeakMap;function l(d){const m=r.render.frame,_=d.geometry,p=t.get(d,_);if(a.get(p)!==m&&(t.update(p),a.set(p,m)),d.isInstancedMesh&&(d.hasEventListener("dispose",u)===!1&&d.addEventListener("dispose",u),a.get(d)!==m&&(e.update(d.instanceMatrix,s.ARRAY_BUFFER),d.instanceColor!==null&&e.update(d.instanceColor,s.ARRAY_BUFFER),a.set(d,m))),d.isSkinnedMesh){const g=d.skeleton;a.get(g)!==m&&(g.update(),a.set(g,m))}return p}function h(){a=new WeakMap}function u(d){const m=d.target;m.removeEventListener("dispose",u),i.releaseStatesOfObject(m),e.remove(m.instanceMatrix),m.instanceColor!==null&&e.remove(m.instanceColor)}return{update:l,dispose:h}}const Xv={[$d]:"LINEAR_TONE_MAPPING",[Yd]:"REINHARD_TONE_MAPPING",[Kd]:"CINEON_TONE_MAPPING",[Jd]:"ACES_FILMIC_TONE_MAPPING",[jd]:"AGX_TONE_MAPPING",[tf]:"NEUTRAL_TONE_MAPPING",[Qd]:"CUSTOM_TONE_MAPPING"};function Zv(s,t,e,i,r,a){const l=new vi(t,e,{type:s,depthBuffer:r,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let h=null,u=null,d=null;const m=new yn;m.setAttribute("position",new Mn([-1,3,0,-1,-1,0,3,-1,0],3)),m.setAttribute("uv",new Mn([0,2,0,0,2,0],2));const _=new P_({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),p=new pe(m,_),g=new mh(-1,1,1,-1,0,1);let y=null,w=null,M=!1,v,b=null,I=[],A=!1;this.setSize=function(D,E){l.setSize(D,E),h!==null&&h.setSize(D,E),u!==null&&u.setSize(D,E);for(let x=0;x<I.length;x++){const T=I[x];T.setSize&&T.setSize(D,E)}},this.setEffects=function(D){I=D,A=I.length>0&&I[0].isRenderPass===!0;const E=l.width,x=l.height;I.length>0&&h===null&&(h=new vi(E,x,{type:Li,depthBuffer:!1,stencilBuffer:!1}),u=new vi(E,x,{type:Li,depthBuffer:!1,stencilBuffer:!1}));const T=r===!0&&I.some(H=>H.needsDepthTexture===!0);T!==(l.depthTexture!==null)&&(T===!0&&d===null&&(d=new wr(E,x),a===!0&&(d.format=fs,d.type=Sr)),l.dispose(),l.depthTexture=T?d:null,l.resolveDepthBuffer=T,l.storeMultisampledDepthBuffer=T);for(let H=0;H<I.length;H++){const F=I[H];F.setSize&&F.setSize(E,x),T&&F.needsDepthTexture===!0&&F.setDepthTexture&&F.setDepthTexture(d)}},this.begin=function(D,E){if(M||D.toneMapping===Ji&&I.length===0)return!1;if(b=E,E!==null){const x=E.width,T=E.height;(l.width!==x||l.height!==T)&&this.setSize(x,T)}return A===!1&&D.setRenderTarget(l),v=D.toneMapping,D.toneMapping=Ji,!0},this.hasRenderPass=function(){return A},this.end=function(D,E){D.toneMapping=v,M=!0;let x=l,T=h;for(let H=0;H<I.length;H++){const F=I[H];F.enabled!==!1&&(F.render(D,T,x,E),F.needsSwap!==!1&&(x=T,T=T===h?u:h))}if(y!==D.outputColorSpace||w!==D.toneMapping){y=D.outputColorSpace,w=D.toneMapping,_.defines={},xe.getTransfer(y)===De&&(_.defines.SRGB_TRANSFER="");const H=Xv[w];H&&(_.defines[H]=""),_.needsUpdate=!0}_.uniforms.tDiffuse.value=x.texture,D.setRenderTarget(b),D.render(p,g),b=null,M=!1},this.isCompositing=function(){return M},this.dispose=function(){l.dispose(),h!==null&&h.dispose(),u!==null&&u.dispose(),m.dispose(),_.dispose()}}const If=new En,Df=new wr(1,1),Nf=new bf(1),Ff=new _f,Uf=new a_,Of=new wf,nd=[],id=[],sd=new Float32Array(16),rd=new Float32Array(9),od=new Float32Array(4);function Cr(s,t,e){const i=s[0];if(i<=0||i>0)return s;const r=t*e;let a=nd[r];if(a===void 0&&(a=new Float32Array(r),nd[r]=a),t!==0){i.toArray(a,0);for(let l=1,h=0;l!==t;++l)h+=e,s[l].toArray(a,h)}return a}function un(s,t){if(s.length!==t.length)return!1;for(let e=0,i=s.length;e<i;e++)if(s[e]!==t[e])return!1;return!0}function dn(s,t){for(let e=0,i=t.length;e<i;e++)s[e]=t[e]}function ka(s,t){let e=id[t];e===void 0&&(e=new Int32Array(t),id[t]=e);for(let i=0;i!==t;++i)e[i]=s.allocateTextureUnit();return e}function qv(s,t){const e=this.cache;e[0]!==t&&(s.uniform1f(this.addr,t),e[0]=t)}function $v(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(un(e,t))return;s.uniform2fv(this.addr,t),dn(e,t)}}function Yv(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(s.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(un(e,t))return;s.uniform3fv(this.addr,t),dn(e,t)}}function Kv(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(un(e,t))return;s.uniform4fv(this.addr,t),dn(e,t)}}function Jv(s,t){const e=this.cache,i=t.elements;if(i===void 0){if(un(e,t))return;s.uniformMatrix2fv(this.addr,!1,t),dn(e,t)}else{if(un(e,i))return;od.set(i),s.uniformMatrix2fv(this.addr,!1,od),dn(e,i)}}function Qv(s,t){const e=this.cache,i=t.elements;if(i===void 0){if(un(e,t))return;s.uniformMatrix3fv(this.addr,!1,t),dn(e,t)}else{if(un(e,i))return;rd.set(i),s.uniformMatrix3fv(this.addr,!1,rd),dn(e,i)}}function jv(s,t){const e=this.cache,i=t.elements;if(i===void 0){if(un(e,t))return;s.uniformMatrix4fv(this.addr,!1,t),dn(e,t)}else{if(un(e,i))return;sd.set(i),s.uniformMatrix4fv(this.addr,!1,sd),dn(e,i)}}function tx(s,t){const e=this.cache;e[0]!==t&&(s.uniform1i(this.addr,t),e[0]=t)}function ex(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(un(e,t))return;s.uniform2iv(this.addr,t),dn(e,t)}}function nx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(un(e,t))return;s.uniform3iv(this.addr,t),dn(e,t)}}function ix(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(un(e,t))return;s.uniform4iv(this.addr,t),dn(e,t)}}function sx(s,t){const e=this.cache;e[0]!==t&&(s.uniform1ui(this.addr,t),e[0]=t)}function rx(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(s.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(un(e,t))return;s.uniform2uiv(this.addr,t),dn(e,t)}}function ox(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(s.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(un(e,t))return;s.uniform3uiv(this.addr,t),dn(e,t)}}function ax(s,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(s.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(un(e,t))return;s.uniform4uiv(this.addr,t),dn(e,t)}}function Ha(s){return s.version===0&&(s.compareFunction=uf,s.needsUpdate=!0),s}function lx(s,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(s.uniform1i(this.addr,r),i[0]=r);let a;this.type===s.SAMPLER_2D_SHADOW?a=Ha(Df):a=If,e.setTexture2D(t||a,r)}function cx(s,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(s.uniform1i(this.addr,r),i[0]=r),e.setTexture3D(t||Uf,r)}function hx(s,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(s.uniform1i(this.addr,r),i[0]=r);let a;this.type===s.SAMPLER_CUBE_SHADOW?a=Ha(Nf):a=Of,e.setTextureCube(t||a,r)}function ux(s,t,e){const i=this.cache,r=e.allocateTextureUnit();i[0]!==r&&(s.uniform1i(this.addr,r),i[0]=r),e.setTexture2DArray(t||Ff,r)}function dx(s){switch(s){case 5126:return qv;case 35664:return $v;case 35665:return Yv;case 35666:return Kv;case 35674:return Jv;case 35675:return Qv;case 35676:return jv;case 5124:case 35670:return tx;case 35667:case 35671:return ex;case 35668:case 35672:return nx;case 35669:case 35673:return ix;case 5125:return sx;case 36294:return rx;case 36295:return ox;case 36296:return ax;case 35678:case 36198:case 36298:case 36306:case 35682:return lx;case 35679:case 36299:case 36307:return cx;case 35680:case 36300:case 36308:case 36293:return hx;case 36289:case 36303:case 36311:case 36292:return ux}}function fx(s,t){s.uniform1fv(this.addr,t)}function px(s,t){const e=Cr(t,this.size,2);s.uniform2fv(this.addr,e)}function mx(s,t){const e=Cr(t,this.size,3);s.uniform3fv(this.addr,e)}function _x(s,t){const e=Cr(t,this.size,4);s.uniform4fv(this.addr,e)}function gx(s,t){const e=Cr(t,this.size,4);s.uniformMatrix2fv(this.addr,!1,e)}function vx(s,t){const e=Cr(t,this.size,9);s.uniformMatrix3fv(this.addr,!1,e)}function xx(s,t){const e=Cr(t,this.size,16);s.uniformMatrix4fv(this.addr,!1,e)}function Mx(s,t){s.uniform1iv(this.addr,t)}function yx(s,t){s.uniform2iv(this.addr,t)}function Sx(s,t){s.uniform3iv(this.addr,t)}function wx(s,t){s.uniform4iv(this.addr,t)}function bx(s,t){s.uniform1uiv(this.addr,t)}function Ex(s,t){s.uniform2uiv(this.addr,t)}function Tx(s,t){s.uniform3uiv(this.addr,t)}function Ax(s,t){s.uniform4uiv(this.addr,t)}function Rx(s,t,e){const i=this.cache,r=t.length,a=ka(e,r);un(i,a)||(s.uniform1iv(this.addr,a),dn(i,a));let l;this.type===s.SAMPLER_2D_SHADOW?l=Ha(Df):l=If;for(let h=0;h!==r;++h)e.setTexture2D(t[h]||l,a[h])}function Px(s,t,e){const i=this.cache,r=t.length,a=ka(e,r);un(i,a)||(s.uniform1iv(this.addr,a),dn(i,a));for(let l=0;l!==r;++l)e.setTexture3D(t[l]||Uf,a[l])}function Cx(s,t,e){const i=this.cache,r=t.length,a=ka(e,r);un(i,a)||(s.uniform1iv(this.addr,a),dn(i,a));let l;this.type===s.SAMPLER_CUBE_SHADOW?l=Ha(Nf):l=Of;for(let h=0;h!==r;++h)e.setTextureCube(t[h]||l,a[h])}function Lx(s,t,e){const i=this.cache,r=t.length,a=ka(e,r);un(i,a)||(s.uniform1iv(this.addr,a),dn(i,a));for(let l=0;l!==r;++l)e.setTexture2DArray(t[l]||Ff,a[l])}function Ix(s){switch(s){case 5126:return fx;case 35664:return px;case 35665:return mx;case 35666:return _x;case 35674:return gx;case 35675:return vx;case 35676:return xx;case 5124:case 35670:return Mx;case 35667:case 35671:return yx;case 35668:case 35672:return Sx;case 35669:case 35673:return wx;case 5125:return bx;case 36294:return Ex;case 36295:return Tx;case 36296:return Ax;case 35678:case 36198:case 36298:case 36306:case 35682:return Rx;case 35679:case 36299:case 36307:return Px;case 35680:case 36300:case 36308:case 36293:return Cx;case 36289:case 36303:case 36311:case 36292:return Lx}}class Dx{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.setValue=dx(e.type)}}class Nx{constructor(t,e,i){this.id=t,this.addr=i,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Ix(e.type)}}class Fx{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,i){const r=this.seq;for(let a=0,l=r.length;a!==l;++a){const h=r[a];h.setValue(t,e[h.id],i)}}}const kl=/(\w+)(\])?(\[|\.)?/g;function ad(s,t){s.seq.push(t),s.map[t.id]=t}function Ux(s,t,e){const i=s.name,r=i.length;for(kl.lastIndex=0;;){const a=kl.exec(i),l=kl.lastIndex;let h=a[1];const u=a[2]==="]",d=a[3];if(u&&(h=h|0),d===void 0||d==="["&&l+2===r){ad(e,d===void 0?new Dx(h,s,t):new Nx(h,s,t));break}else{let _=e.map[h];_===void 0&&(_=new Fx(h),ad(e,_)),e=_}}}class Sa{constructor(t,e){this.seq=[],this.map={};const i=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let l=0;l<i;++l){const h=t.getActiveUniform(e,l),u=t.getUniformLocation(e,h.name);Ux(h,u,this)}const r=[],a=[];for(const l of this.seq)l.type===t.SAMPLER_2D_SHADOW||l.type===t.SAMPLER_CUBE_SHADOW||l.type===t.SAMPLER_2D_ARRAY_SHADOW?r.push(l):a.push(l);r.length>0&&(this.seq=r.concat(a))}setValue(t,e,i,r){const a=this.map[e];a!==void 0&&a.setValue(t,i,r)}setOptional(t,e,i){const r=e[i];r!==void 0&&this.setValue(t,i,r)}static upload(t,e,i,r){for(let a=0,l=e.length;a!==l;++a){const h=e[a],u=i[h.id];u.needsUpdate!==!1&&h.setValue(t,u.value,r)}}static seqWithValue(t,e){const i=[];for(let r=0,a=t.length;r!==a;++r){const l=t[r];l.id in e&&i.push(l)}return i}}function ld(s,t,e){const i=s.createShader(t);return s.shaderSource(i,e),s.compileShader(i),i}const Ox=37297;let zx=0;function Bx(s,t){const e=s.split(`
`),i=[],r=Math.max(t-6,0),a=Math.min(t+6,e.length);for(let l=r;l<a;l++){const h=l+1;i.push(`${h===t?">":" "} ${h}: ${e[l]}`)}return i.join(`
`)}const cd=new oe;function kx(s){xe._getMatrix(cd,xe.workingColorSpace,s);const t=`mat3( ${cd.elements.map(e=>e.toFixed(4))} )`;switch(xe.getTransfer(s)){case Ra:return[t,"LinearTransferOETF"];case De:return[t,"sRGBTransferOETF"];default:return re("WebGLProgram: Unsupported color space: ",s),[t,"LinearTransferOETF"]}}function hd(s,t,e){const i=s.getShaderParameter(t,s.COMPILE_STATUS),a=(s.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";const l=/ERROR: 0:(\d+)/.exec(a);if(l){const h=parseInt(l[1]);return e.toUpperCase()+`

`+a+`

`+Bx(s.getShaderSource(t),h)}else return a}function Hx(s,t){const e=kx(t);return[`vec4 ${s}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}const Gx={[$d]:"Linear",[Yd]:"Reinhard",[Kd]:"Cineon",[Jd]:"ACESFilmic",[jd]:"AgX",[tf]:"Neutral",[Qd]:"Custom"};function Vx(s,t){const e=Gx[t];return e===void 0?(re("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+s+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+s+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const ha=new nt;function Wx(){xe.getLuminanceCoefficients(ha);const s=ha.x.toFixed(4),t=ha.y.toFixed(4),e=ha.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${s}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Xx(s){return[s.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",s.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Kr).join(`
`)}function Zx(s){const t=[];for(const e in s){const i=s[e];i!==!1&&t.push("#define "+e+" "+i)}return t.join(`
`)}function qx(s,t){const e={},i=s.getProgramParameter(t,s.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const a=s.getActiveAttrib(t,r),l=a.name;let h=1;a.type===s.FLOAT_MAT2&&(h=2),a.type===s.FLOAT_MAT3&&(h=3),a.type===s.FLOAT_MAT4&&(h=4),e[l]={type:a.type,location:s.getAttribLocation(t,l),locationSize:h}}return e}function Kr(s){return s!==""}function ud(s,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return s.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function dd(s,t){return s.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const $x=/^[ \t]*#include +<([\w\d./]+)>/gm;function zc(s){return s.replace($x,Yx)}function Yx(s,t){const e=de[t];if(e===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return zc(e)}const Kx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function fd(s){return s.replace(Kx,Jx)}function Jx(s,t,e,i){let r="";for(let a=parseInt(t);a<parseInt(e);a++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return r}function pd(s){let t=`precision ${s.precision} float;
	precision ${s.precision} int;
	precision ${s.precision} sampler2D;
	precision ${s.precision} samplerCube;
	precision ${s.precision} sampler3D;
	precision ${s.precision} sampler2DArray;
	precision ${s.precision} sampler2DShadow;
	precision ${s.precision} samplerCubeShadow;
	precision ${s.precision} sampler2DArrayShadow;
	precision ${s.precision} isampler2D;
	precision ${s.precision} isampler3D;
	precision ${s.precision} isamplerCube;
	precision ${s.precision} isampler2DArray;
	precision ${s.precision} usampler2D;
	precision ${s.precision} usampler3D;
	precision ${s.precision} usamplerCube;
	precision ${s.precision} usampler2DArray;
	`;return s.precision==="highp"?t+=`
#define HIGH_PRECISION`:s.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:s.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const Qx={[jr]:"SHADOWMAP_TYPE_PCF",[Yr]:"SHADOWMAP_TYPE_VSM"};function jx(s){return Qx[s.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const tM={[lo]:"ENVMAP_MODE_REFRACTION"};function eM(s){return s.envMap===!1?"ENVMAP_MODE_REFLECTION":tM[s.envMapMode]||"ENVMAP_MODE_REFLECTION"}const nM={[Kc]:"ENVMAP_BLENDING_MULTIPLY",[Em]:"ENVMAP_BLENDING_MIX",[Tm]:"ENVMAP_BLENDING_ADD"};function iM(s){return s.envMap===!1?"ENVMAP_BLENDING_NONE":nM[s.combine]||"ENVMAP_BLENDING_NONE"}function sM(s,t,e,i){const r=s.getContext(),a=e.defines;let l=e.vertexShader,h=e.fragmentShader;const u=jx(e),d=e.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",m=eM(e),_=iM(e),p=Xx(e),g=Zx(a),y=r.createProgram();let w,M,v=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(w=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Kr).join(`
`),w.length>0&&(w+=`
`),M=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Kr).join(`
`),M.length>0&&(M+=`
`)):(w=[pd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+m:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+e.diffuseRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+u:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Kr).join(`
`),M=[pd(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+d:"",e.envMap?"#define "+m:"",e.envMap?"#define "+_:"",e.envMapPMREM?"#define ENVMAP_MAX_LOD "+e.envMapMaxLod+".0":"",e.envMapPMREM?"#define ENVMAP_SIZE "+e.envMapSize+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+u:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ji?"#define TONE_MAPPING":"",e.toneMapping!==Ji?de.tonemapping_pars_fragment:"",e.toneMapping!==Ji?Vx("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",de.colorspace_pars_fragment,Hx("linearToOutputTexel",e.outputColorSpace),Wx(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Kr).join(`
`)),l=zc(l),l=ud(l,e),l=dd(l,e),h=zc(h),h=ud(h,e),h=dd(h,e),l=fd(l),h=fd(h),e.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,w=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+w,M=["#define varying in",e.glslVersion===xu?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===xu?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+M);const b=v+w+l,I=v+M+h,A=ld(r,r.VERTEX_SHADER,b),D=ld(r,r.FRAGMENT_SHADER,I);r.attachShader(y,A),r.attachShader(y,D),e.index0AttributeName!==void 0?r.bindAttribLocation(y,0,e.index0AttributeName):e.hasPositionAttribute===!0&&r.bindAttribLocation(y,0,"position"),r.linkProgram(y);function E(F){if(s.debug.checkShaderErrors){const k=r.getProgramInfoLog(y)||"",G=r.getShaderInfoLog(A)||"",W=r.getShaderInfoLog(D)||"",z=k.trim(),j=G.trim(),rt=W.trim();let $=!0,st=!0;if(r.getProgramParameter(y,r.LINK_STATUS)===!1)if($=!1,typeof s.debug.onShaderError=="function")s.debug.onShaderError(r,y,A,D);else{const tt=hd(r,A,"vertex"),Y=hd(r,D,"fragment");Te("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+F.name+`
Material Type: `+F.type+`

Program Info Log: `+z+`
`+tt+`
`+Y)}else z!==""?re("WebGLProgram: Program Info Log:",z):(j===""||rt==="")&&(st=!1);st&&(F.diagnostics={runnable:$,programLog:z,vertexShader:{log:j,prefix:w},fragmentShader:{log:rt,prefix:M}})}r.deleteShader(A),r.deleteShader(D),x=new Sa(r,y),T=qx(r,y)}let x;this.getUniforms=function(){return x===void 0&&E(this),x};let T;this.getAttributes=function(){return T===void 0&&E(this),T};let H=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return H===!1&&(H=r.getProgramParameter(y,Ox)),H},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=zx++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=A,this.fragmentShader=D,this}let rM=0;class oM{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,i){const r=this._getShaderCacheForMaterial(t);return r.has(e)===!1&&(r.add(e),e.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const i of e)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let i=e.get(t);return i===void 0&&(i=new Set,e.set(t,i)),i}_getShaderStage(t){const e=this.shaderCache;let i=e.get(t);return i===void 0&&(i=new aM(t),e.set(t,i)),i}}class aM{constructor(t){this.id=rM++,this.code=t,this.usedTimes=0}}function lM(s){return s===Os||s===Ta||s===Aa}function cM(s,t,e,i,r,a){const l=new ah,h=new oM,u=new Set,d=[],m=new Map,_=i.logarithmicDepthBuffer,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(x){return u.add(x),x===0?"uv":`uv${x}`}function y(x,T,H,F,k,G){const W=F.fog,z=k.geometry,j=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?F.environment:null,rt=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,$=t.get(x.envMap||j,rt),st=p[x.type];let tt=i.precision;x.precision!==null&&(tt=i.getMaxPrecision(x.precision),tt!==x.precision&&re("WebGLProgram.getParameters:",x.precision,"not supported, using",tt,"instead."));const Y=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,lt=Y!==void 0?Y.length:0;let St=0;z.morphAttributes.position!==void 0&&(St=1),z.morphAttributes.normal!==void 0&&(St=2),z.morphAttributes.color!==void 0&&(St=3);let Dt,J,Mt,yt;if(st){const Pt=Ti[st];Dt=Pt.vertexShader,J=Pt.fragmentShader}else{Dt=x.vertexShader,J=x.fragmentShader;const Pt=h.getVertexShaderStage(x),ne=h.getFragmentShaderStage(x);h.update(x,Pt,ne),Mt=Pt.id,yt=ne.id}const Wt=s.getRenderTarget(),Rt=s.state.buffers.depth.getReversed(),jt=k.isInstancedMesh===!0,we=k.isBatchedMesh===!0,Jt=!!x.map,fe=!!x.matcap,ve=!!$,ce=ve&&$.isPMREMTexture===!0,We=!!x.aoMap,He=!!x.lightMap,Qe=!!x.bumpMap&&x.wireframe===!1,Re=!!x.normalMap,Ln=!!x.displacementMap,ze=!!x.emissiveMap,je=!!x.metalnessMap,fn=!!x.roughnessMap,Sn=x.anisotropy>0,K=x.clearcoat>0,tn=x.diffuseRoughness>0,Pe=x.dispersion>0,Ie=x.retroreflectivity>0,Ct=x.iridescence>0,ke=x.sheen>0,Yt=x.transmission>0,te=Sn&&!!x.anisotropyMap,O=K&&!!x.clearcoatMap,R=K&&!!x.clearcoatNormalMap,ht=K&&!!x.clearcoatRoughnessMap,N=tn&&!!x.diffuseRoughnessMap,U=Ct&&!!x.iridescenceMap,X=Ct&&!!x.iridescenceThicknessMap,it=ke&&!!x.sheenColorMap,q=ke&&!!x.sheenRoughnessMap,ot=!!x.specularMap,_t=!!x.specularColorMap,B=!!x.specularIntensityMap,at=Yt&&!!x.transmissionMap,et=Yt&&!!x.thicknessMap,vt=!!x.gradientMap,gt=!!x.alphaMap,mt=x.alphaTest>0,Ot=!!x.alphaHash,Ft=!!x.extensions;let xt=Ji;x.toneMapped&&(Wt===null||Wt.isXRRenderTarget===!0)&&(xt=s.toneMapping);const kt=ce?$.isCompressedCubeTexture?$.image[0].mipmaps:$.mipmaps:null,qt={shaderID:st,shaderType:x.type,shaderName:x.name,vertexShader:Dt,fragmentShader:J,defines:x.defines,customVertexShaderID:Mt,customFragmentShaderID:yt,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:tt,batching:we,batchingColor:we&&k._colorsTexture!==null,instancing:jt,instancingColor:jt&&k.instanceColor!==null,instancingMorph:jt&&k.morphTexture!==null,outputColorSpace:Wt===null?s.outputColorSpace:Wt.isXRRenderTarget===!0?Wt.texture.colorSpace:xe.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:Jt,matcap:fe,envMap:ve,envMapMode:ve&&$.mapping,envMapPMREM:ce,envMapMaxLod:ce?kt.length-1:null,envMapSize:ce?kt[0].width:null,aoMap:We,lightMap:He,bumpMap:Qe,normalMap:Re,displacementMap:Ln,emissiveMap:ze,normalMapObjectSpace:Re&&x.normalMapType===Pm,normalMapTangentSpace:Re&&x.normalMapType===Nc,packedNormalMap:Re&&x.normalMapType===Nc&&lM(x.normalMap.format),metalnessMap:je,roughnessMap:fn,anisotropy:Sn,anisotropyMap:te,clearcoat:K,clearcoatMap:O,clearcoatNormalMap:R,clearcoatRoughnessMap:ht,diffuseRoughness:tn,diffuseRoughnessMap:N,dispersion:Pe,retroreflection:Ie,iridescence:Ct,iridescenceMap:U,iridescenceThicknessMap:X,sheen:ke,sheenColorMap:it,sheenRoughnessMap:q,specularMap:ot,specularColorMap:_t,specularIntensityMap:B,transmission:Yt,transmissionMap:at,thicknessMap:et,gradientMap:vt,opaque:x.transparent===!1&&x.blending===to&&x.alphaToCoverage===!1,alphaMap:gt,alphaTest:mt,alphaHash:Ot,combine:x.combine,mapUv:Jt&&g(x.map.channel),aoMapUv:We&&g(x.aoMap.channel),lightMapUv:He&&g(x.lightMap.channel),bumpMapUv:Qe&&g(x.bumpMap.channel),normalMapUv:Re&&g(x.normalMap.channel),displacementMapUv:Ln&&g(x.displacementMap.channel),emissiveMapUv:ze&&g(x.emissiveMap.channel),metalnessMapUv:je&&g(x.metalnessMap.channel),roughnessMapUv:fn&&g(x.roughnessMap.channel),anisotropyMapUv:te&&g(x.anisotropyMap.channel),clearcoatMapUv:O&&g(x.clearcoatMap.channel),clearcoatNormalMapUv:R&&g(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ht&&g(x.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:N&&g(x.diffuseRoughnessMap.channel),iridescenceMapUv:U&&g(x.iridescenceMap.channel),iridescenceThicknessMapUv:X&&g(x.iridescenceThicknessMap.channel),sheenColorMapUv:it&&g(x.sheenColorMap.channel),sheenRoughnessMapUv:q&&g(x.sheenRoughnessMap.channel),specularMapUv:ot&&g(x.specularMap.channel),specularColorMapUv:_t&&g(x.specularColorMap.channel),specularIntensityMapUv:B&&g(x.specularIntensityMap.channel),transmissionMapUv:at&&g(x.transmissionMap.channel),thicknessMapUv:et&&g(x.thicknessMap.channel),alphaMapUv:gt&&g(x.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(Re||Sn),vertexNormals:!!z.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!z.attributes.uv&&(Jt||gt),fog:!!W,useFog:x.fog===!0,fogExp2:!!W&&W.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||z.attributes.normal===void 0&&Re===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:_,reversedDepthBuffer:Rt,skinning:k.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:lt,morphTextureStride:St,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:G.filter(Pt=>Pt.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:x.dithering,shadowMapEnabled:s.shadowMap.enabled&&H.length>0,shadowMapType:s.shadowMap.type,toneMapping:xt,decodeVideoTexture:Jt&&x.map.isVideoTexture===!0&&xe.getTransfer(x.map.colorSpace)===De,decodeVideoTextureEmissive:ze&&x.emissiveMap.isVideoTexture===!0&&xe.getTransfer(x.emissiveMap.colorSpace)===De,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===$n,flipSided:x.side===zn,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:Ft&&x.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ft&&x.extensions.multiDraw===!0||we)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return qt.vertexUv1s=u.has(1),qt.vertexUv2s=u.has(2),qt.vertexUv3s=u.has(3),u.clear(),qt}function w(x){const T=[];if(x.shaderID?T.push(x.shaderID):(T.push(x.customVertexShaderID),T.push(x.customFragmentShaderID)),x.defines!==void 0)for(const H in x.defines)T.push(H),T.push(x.defines[H]);return x.isRawShaderMaterial===!1&&(M(T,x),v(T,x),T.push(s.outputColorSpace)),T.push(x.customProgramCacheKey),T.join()}function M(x,T){x.push(T.precision),x.push(T.outputColorSpace),x.push(T.envMapMode),x.push(T.envMapPMREM),x.push(T.envMapMaxLod),x.push(T.envMapSize),x.push(T.mapUv),x.push(T.alphaMapUv),x.push(T.lightMapUv),x.push(T.aoMapUv),x.push(T.bumpMapUv),x.push(T.normalMapUv),x.push(T.displacementMapUv),x.push(T.emissiveMapUv),x.push(T.metalnessMapUv),x.push(T.roughnessMapUv),x.push(T.anisotropyMapUv),x.push(T.clearcoatMapUv),x.push(T.clearcoatNormalMapUv),x.push(T.clearcoatRoughnessMapUv),x.push(T.diffuseRoughnessMapUv),x.push(T.iridescenceMapUv),x.push(T.iridescenceThicknessMapUv),x.push(T.sheenColorMapUv),x.push(T.sheenRoughnessMapUv),x.push(T.specularMapUv),x.push(T.specularColorMapUv),x.push(T.specularIntensityMapUv),x.push(T.transmissionMapUv),x.push(T.thicknessMapUv),x.push(T.combine),x.push(T.fogExp2),x.push(T.sizeAttenuation),x.push(T.morphTargetsCount),x.push(T.numSunLights),x.push(T.numDirLights),x.push(T.numPointLights),x.push(T.numSpotLights),x.push(T.numSpotLightMaps),x.push(T.numHemiLights),x.push(T.numRectAreaLights),x.push(T.numSunLightShadows),x.push(T.numDirLightShadows),x.push(T.numPointLightShadows),x.push(T.numSpotLightShadows),x.push(T.numSpotLightShadowsWithMaps),x.push(T.numLightProbes),x.push(T.numLightProbeGrids),x.push(T.shadowMapType),x.push(T.toneMapping),x.push(T.numClippingPlanes),x.push(T.numClipIntersection),x.push(T.depthPacking)}function v(x,T){l.disableAll(),T.instancing&&l.enable(0),T.instancingColor&&l.enable(1),T.instancingMorph&&l.enable(2),T.matcap&&l.enable(3),T.envMap&&l.enable(4),T.normalMapObjectSpace&&l.enable(5),T.normalMapTangentSpace&&l.enable(6),T.clearcoat&&l.enable(7),T.iridescence&&l.enable(8),T.alphaTest&&l.enable(9),T.vertexColors&&l.enable(10),T.vertexAlphas&&l.enable(11),T.vertexUv1s&&l.enable(12),T.vertexUv2s&&l.enable(13),T.vertexUv3s&&l.enable(14),T.vertexTangents&&l.enable(15),T.anisotropy&&l.enable(16),T.alphaHash&&l.enable(17),T.batching&&l.enable(18),T.dispersion&&l.enable(19),T.retroreflection&&l.enable(24),T.diffuseRoughness&&l.enable(25),T.batchingColor&&l.enable(20),T.gradientMap&&l.enable(21),T.packedNormalMap&&l.enable(22),T.vertexNormals&&l.enable(23),x.push(l.mask),l.disableAll(),T.fog&&l.enable(0),T.useFog&&l.enable(1),T.flatShading&&l.enable(2),T.logarithmicDepthBuffer&&l.enable(3),T.reversedDepthBuffer&&l.enable(4),T.skinning&&l.enable(5),T.morphTargets&&l.enable(6),T.morphNormals&&l.enable(7),T.morphColors&&l.enable(8),T.premultipliedAlpha&&l.enable(9),T.shadowMapEnabled&&l.enable(10),T.doubleSided&&l.enable(11),T.flipSided&&l.enable(12),T.useDepthPacking&&l.enable(13),T.dithering&&l.enable(14),T.transmission&&l.enable(15),T.sheen&&l.enable(16),T.opaque&&l.enable(17),T.pointsUvs&&l.enable(18),T.decodeVideoTexture&&l.enable(19),T.decodeVideoTextureEmissive&&l.enable(20),T.alphaToCoverage&&l.enable(21),T.numLightProbeGrids>0&&l.enable(22),T.hasPositionAttribute&&l.enable(23),x.push(l.mask)}function b(x){const T=p[x.type];let H;if(T){const F=Ti[T];H=T_.clone(F.uniforms)}else H=x.uniforms;return H}function I(x,T){let H=m.get(T);return H!==void 0?++H.usedTimes:(H=new sM(s,T,x,r),d.push(H),m.set(T,H)),H}function A(x){if(--x.usedTimes===0){const T=d.indexOf(x);d[T]=d[d.length-1],d.pop(),m.delete(x.cacheKey),x.destroy()}}function D(x){h.remove(x)}function E(){h.dispose()}return{getParameters:y,getProgramCacheKey:w,getUniforms:b,acquireProgram:I,releaseProgram:A,releaseShaderCache:D,programs:d,dispose:E}}function hM(){let s=new WeakMap;function t(l){return s.has(l)}function e(l){let h=s.get(l);return h===void 0&&(h={},s.set(l,h)),h}function i(l){s.delete(l)}function r(l,h,u){s.get(l)[h]=u}function a(){s=new WeakMap}return{has:t,get:e,remove:i,update:r,dispose:a}}function uM(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.material.id!==t.material.id?s.material.id-t.material.id:s.materialVariant!==t.materialVariant?s.materialVariant-t.materialVariant:s.z!==t.z?s.z-t.z:s.id-t.id}function md(s,t){return s.groupOrder!==t.groupOrder?s.groupOrder-t.groupOrder:s.renderOrder!==t.renderOrder?s.renderOrder-t.renderOrder:s.z!==t.z?t.z-s.z:s.id-t.id}function _d(){const s=[];let t=0;const e=[],i=[],r=[];function a(){t=0,e.length=0,i.length=0,r.length=0}function l(p){let g=0;return p.isInstancedMesh&&(g+=2),p.isSkinnedMesh&&(g+=1),g}function h(p,g,y,w,M,v){let b=s[t];return b===void 0?(b={id:p.id,object:p,geometry:g,material:y,materialVariant:l(p),groupOrder:w,renderOrder:p.renderOrder,z:M,group:v},s[t]=b):(b.id=p.id,b.object=p,b.geometry=g,b.material=y,b.materialVariant=l(p),b.groupOrder=w,b.renderOrder=p.renderOrder,b.z=M,b.group=v),t++,b}function u(p,g,y,w,M,v,b){b.reversedDepth===!0&&(M=-M);const I=h(p,g,y,w,M,v);y.transmission>0?i.push(I):y.transparent===!0?r.push(I):e.push(I)}function d(p,g,y,w,M,v){const b=h(p,g,y,w,M,v);y.transmission>0?i.unshift(b):y.transparent===!0?r.unshift(b):e.unshift(b)}function m(p,g){e.length>1&&e.sort(p||uM),i.length>1&&i.sort(g||md),r.length>1&&r.sort(g||md)}function _(){for(let p=t,g=s.length;p<g;p++){const y=s[p];if(y.id===null)break;y.id=null,y.object=null,y.geometry=null,y.material=null,y.group=null}}return{opaque:e,transmissive:i,transparent:r,init:a,push:u,unshift:d,finish:_,sort:m}}function dM(){let s=new WeakMap;function t(i,r){const a=s.get(i);let l;return a===void 0?(l=new _d,s.set(i,[l])):r>=a.length?(l=new _d,a.push(l)):l=a[r],l}function e(){s=new WeakMap}return{get:t,dispose:e}}function fM(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new nt,color:new Qt};break;case"SpotLight":e={position:new nt,direction:new nt,color:new Qt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new nt,color:new Qt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new nt,skyColor:new Qt,groundColor:new Qt};break;case"RectAreaLight":e={color:new Qt,position:new nt,halfWidth:new nt,halfHeight:new nt};break}return s[t.id]=e,e}}}function pM(){const s={};return{get:function(t){if(s[t.id]!==void 0)return s[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new le,shadowCameraNear:1,shadowCameraFar:1e3};break}return s[t.id]=e,e}}}let mM=0;function _M(s,t){return(t.castShadow?2:0)-(s.castShadow?2:0)+(t.map?1:0)-(s.map?1:0)}function gM(s){const t=new fM,e=pM(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let d=0;d<9;d++)i.probe.push(new nt);const r=new nt,a=new Ae,l=new Ae;function h(d){let m=0,_=0,p=0;for(let G=0;G<9;G++)i.probe[G].set(0,0,0);let g=0,y=0,w=0,M=0,v=0,b=0,I=0,A=0,D=0,E=0,x=0,T=0,H=0,F=0;d.sort(_M);for(let G=0,W=d.length;G<W;G++){const z=d[G],j=z.color,rt=z.intensity,$=z.distance;let st=null;if(z.shadow&&z.shadow.map&&(z.shadow.map.texture.format===Os?st=z.shadow.map.texture:st=z.shadow.map.depthTexture||z.shadow.map.texture),z.isAmbientLight)m+=j.r*rt,_+=j.g*rt,p+=j.b*rt;else if(z.isLightProbe){for(let tt=0;tt<9;tt++)i.probe[tt].addScaledVector(z.sh.coefficients[tt],rt);F++}else if(z.isSunLight){const tt=t.get(z);if(tt.color.copy(z.color).multiplyScalar(z.intensity),z.castShadow){const Y=z.shadow,lt=e.get(z);lt.shadowIntensity=Y.intensity,lt.shadowBias=Y.bias,lt.shadowNormalBias=Y.normalBias,lt.shadowRadius=Y.radius,lt.shadowMapSize.copy(Y.mapSize).multiply(Y.getFrameExtents()),i.sunShadow[y]=lt,i.sunShadowMap[y]=st;const St=Y.getViewportCount();for(let Dt=0;Dt<St;Dt++)i.sunShadowMatrix[w+Dt]=Y.getMatrix(Dt),i.sunShadowCascade[w+Dt]=Y._cascadeData[Dt];w+=St,y++}i.sun[g]=tt,g++}else if(z.isDirectionalLight){const tt=t.get(z);if(tt.color.copy(z.color).multiplyScalar(z.intensity),z.castShadow){const Y=z.shadow,lt=e.get(z);lt.shadowIntensity=Y.intensity,lt.shadowBias=Y.bias,lt.shadowNormalBias=Y.normalBias,lt.shadowRadius=Y.radius,lt.shadowMapSize=Y.mapSize,i.directionalShadow[M]=lt,i.directionalShadowMap[M]=st,i.directionalShadowMatrix[M]=z.shadow.matrix,D++}i.directional[M]=tt,M++}else if(z.isSpotLight){const tt=t.get(z);tt.position.setFromMatrixPosition(z.matrixWorld),tt.color.copy(j).multiplyScalar(rt),tt.distance=$,tt.coneCos=Math.cos(z.angle),tt.penumbraCos=Math.cos(z.angle*(1-z.penumbra)),tt.decay=z.decay,i.spot[b]=tt;const Y=z.shadow;if(z.map&&(i.spotLightMap[T]=z.map,T++,Y.updateMatrices(z),z.castShadow&&H++),i.spotLightMatrix[b]=Y.matrix,z.castShadow){const lt=e.get(z);lt.shadowIntensity=Y.intensity,lt.shadowBias=Y.bias,lt.shadowNormalBias=Y.normalBias,lt.shadowRadius=Y.radius,lt.shadowMapSize=Y.mapSize,i.spotShadow[b]=lt,i.spotShadowMap[b]=st,x++}b++}else if(z.isRectAreaLight){const tt=t.get(z);tt.color.copy(j).multiplyScalar(rt),tt.halfWidth.set(z.width*.5,0,0),tt.halfHeight.set(0,z.height*.5,0),i.rectArea[I]=tt,I++}else if(z.isPointLight){const tt=t.get(z);if(tt.color.copy(z.color).multiplyScalar(z.intensity),tt.distance=z.distance,tt.decay=z.decay,z.castShadow){const Y=z.shadow,lt=e.get(z);lt.shadowIntensity=Y.intensity,lt.shadowBias=Y.bias,lt.shadowNormalBias=Y.normalBias,lt.shadowRadius=Y.radius,lt.shadowMapSize=Y.mapSize,lt.shadowCameraNear=Y.camera.near,lt.shadowCameraFar=Y.camera.far,i.pointShadow[v]=lt,i.pointShadowMap[v]=st,i.pointShadowMatrix[v]=z.shadow.matrix,E++}i.point[v]=tt,v++}else if(z.isHemisphereLight){const tt=t.get(z);tt.skyColor.copy(z.color).multiplyScalar(rt),tt.groundColor.copy(z.groundColor).multiplyScalar(rt),i.hemi[A]=tt,A++}}I>0&&(s.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Bt.LTC_FLOAT_1,i.rectAreaLTC2=Bt.LTC_FLOAT_2):(i.rectAreaLTC1=Bt.LTC_HALF_1,i.rectAreaLTC2=Bt.LTC_HALF_2)),i.ambient[0]=m,i.ambient[1]=_,i.ambient[2]=p;const k=i.hash;(k.sunLength!==g||k.directionalLength!==M||k.pointLength!==v||k.spotLength!==b||k.rectAreaLength!==I||k.hemiLength!==A||k.numSunShadows!==y||k.numDirectionalShadows!==D||k.numPointShadows!==E||k.numSpotShadows!==x||k.numSpotMaps!==T||k.numLightProbes!==F)&&(i.sun.length=g,i.directional.length=M,i.spot.length=b,i.rectArea.length=I,i.point.length=v,i.hemi.length=A,i.sunShadow.length=y,i.sunShadowMap.length=y,i.sunShadowMatrix.length=w,i.sunShadowCascade.length=w,i.directionalShadow.length=D,i.directionalShadowMap.length=D,i.directionalShadowMatrix.length=D,i.pointShadow.length=E,i.pointShadowMap.length=E,i.pointShadowMatrix.length=E,i.spotShadow.length=x,i.spotShadowMap.length=x,i.spotLightMatrix.length=x+T-H,i.spotLightMap.length=T,i.numSpotLightShadowsWithMaps=H,i.numLightProbes=F,k.sunLength=g,k.directionalLength=M,k.pointLength=v,k.spotLength=b,k.rectAreaLength=I,k.hemiLength=A,k.numSunShadows=y,k.numDirectionalShadows=D,k.numPointShadows=E,k.numSpotShadows=x,k.numSpotMaps=T,k.numLightProbes=F,i.version=mM++)}function u(d,m){let _=0,p=0,g=0,y=0,w=0,M=0;const v=m.matrixWorldInverse;for(let b=0,I=d.length;b<I;b++){const A=d[b];if(A.isSunLight){const D=i.sun[_];D.direction.setFromMatrixPosition(A.matrixWorld),D.direction.transformDirection(v),_++}else if(A.isDirectionalLight){const D=i.directional[p];D.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),D.direction.sub(r),D.direction.transformDirection(v),p++}else if(A.isSpotLight){const D=i.spot[y];D.position.setFromMatrixPosition(A.matrixWorld),D.position.applyMatrix4(v),D.direction.setFromMatrixPosition(A.matrixWorld),r.setFromMatrixPosition(A.target.matrixWorld),D.direction.sub(r),D.direction.transformDirection(v),y++}else if(A.isRectAreaLight){const D=i.rectArea[w];D.position.setFromMatrixPosition(A.matrixWorld),D.position.applyMatrix4(v),l.identity(),a.copy(A.matrixWorld),a.premultiply(v),l.extractRotation(a),D.halfWidth.set(A.width*.5,0,0),D.halfHeight.set(0,A.height*.5,0),D.halfWidth.applyMatrix4(l),D.halfHeight.applyMatrix4(l),w++}else if(A.isPointLight){const D=i.point[g];D.position.setFromMatrixPosition(A.matrixWorld),D.position.applyMatrix4(v),g++}else if(A.isHemisphereLight){const D=i.hemi[M];D.direction.setFromMatrixPosition(A.matrixWorld),D.direction.transformDirection(v),M++}}}return{setup:h,setupView:u,state:i}}function gd(s){const t=new gM(s),e=[],i=[],r=[];function a(_){m.camera=_,e.length=0,i.length=0,r.length=0}function l(_){_.isLightProbeGrid?r.push(_):e.push(_)}function h(_){i.push(_)}function u(){t.setup(e),r.sort((_,p)=>_.priority-p.priority||_.id-p.id)}function d(_){t.setupView(e,_)}const m={lightsArray:e,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:m,setupLights:u,setupLightsView:d,pushLight:l,pushShadow:h}}function vM(s){let t=new WeakMap;function e(r,a=0){const l=t.get(r);let h;return l===void 0?(h=new gd(s),t.set(r,[h])):a>=l.length?(h=new gd(s),l.push(h)):h=l[a],h}function i(){t=new WeakMap}return{get:e,dispose:i}}const xM=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,MM=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,yM=[new nt(1,0,0),new nt(-1,0,0),new nt(0,1,0),new nt(0,-1,0),new nt(0,0,1),new nt(0,0,-1)],SM=[new nt(0,-1,0),new nt(0,-1,0),new nt(0,0,1),new nt(0,0,-1),new nt(0,-1,0),new nt(0,-1,0)],vd=new Ae,Zr=new nt,Hl=new nt;function wM(s,t,e){let i=new mo;const r=new le,a=new le,l=new Ze,h=new C_,u=new L_,d={},m=e.maxTextureSize,_={[es]:zn,[zn]:es,[$n]:$n},p=new Ii({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new le},radius:{value:4}},vertexShader:xM,fragmentShader:MM}),g=p.clone();g.defines.HORIZONTAL_PASS=1;const y=new yn;y.setAttribute("position",new xn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const w=new pe(y,p),M=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=jr;let v=this.type;this.render=function(E,x,T){if(M.enabled===!1||M.autoUpdate===!1&&M.needsUpdate===!1||E.length===0)return;this.type===om&&(re("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=jr);const H=s.getRenderTarget(),F=s.getActiveCubeFace(),k=s.getActiveMipmapLevel(),G=s.state;G.setBlending(vr),G.buffers.depth.getReversed()===!0?G.buffers.color.setClear(0,0,0,0):G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const W=v!==this.type;W&&x.traverse(function(z){z.material&&(Array.isArray(z.material)?z.material.forEach(j=>j.needsUpdate=!0):z.material.needsUpdate=!0)});for(let z=0,j=E.length;z<j;z++){const rt=E[z],$=rt.shadow;if($===void 0){re("WebGLShadowMap:",rt,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const st=$.getFrameExtents();r.multiply(st),a.copy($.mapSize),(r.x>m||r.y>m)&&(r.x>m&&(a.x=Math.floor(m/st.x),r.x=a.x*st.x,$.mapSize.x=a.x),r.y>m&&(a.y=Math.floor(m/st.y),r.y=a.y*st.y,$.mapSize.y=a.y));const tt=s.state.buffers.depth.getReversed();if($.camera._reversedDepth=tt,$.map===null||W===!0){if($.map!==null&&($.map.depthTexture!==null&&($.map.depthTexture.dispose(),$.map.depthTexture=null),$.map.dispose()),this.type===Yr){if(rt.isPointLight){re("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}$.map=new vi(r.x,r.y,{format:Os,type:Li,minFilter:On,magFilter:On,generateMipmaps:!1}),$.map.texture.name=rt.name+".shadowMap",$.map.depthTexture=new wr(r.x,r.y,pi),$.map.depthTexture.name=rt.name+".shadowMapDepth",$.map.depthTexture.format=vs,$.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=rn,$.map.depthTexture.magFilter=rn}else rt.isPointLight?($.map=new _h(r.x),$.map.depthTexture=new bf(r.x,Ci)):($.map=new vi(r.x,r.y),$.map.depthTexture=new wr(r.x,r.y,Ci)),$.map.depthTexture.name=rt.name+".shadowMap",$.map.depthTexture.format=vs,this.type===jr?($.map.depthTexture.compareFunction=tt?hf:cf,$.map.depthTexture.minFilter=On,$.map.depthTexture.magFilter=On):($.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=rn,$.map.depthTexture.magFilter=rn);$.camera.updateProjectionMatrix()}$.map.isWebGLCubeRenderTarget!==!0&&($.map.width!==r.x||$.map.height!==r.y)&&$.map.setSize(r.x,r.y);const Y=$.map.isWebGLCubeRenderTarget?6:$.getViewportCount();rt.isPointLight!==!0&&$.updateMatrices(rt,T);const lt=($.camera.layers.mask&4294967294)!==0?$.camera.layers:T.layers;for(let St=0;St<Y;St++){const Dt=$.getCamera(St);if(rt.isPointLight){const J=$.camera,Mt=$.matrix,yt=rt.distance||J.far;yt!==J.far&&(J.far=yt,J.updateProjectionMatrix()),Zr.setFromMatrixPosition(rt.matrixWorld),J.position.copy(Zr),Hl.copy(J.position),Hl.add(yM[St]),J.up.copy(SM[St]),J.lookAt(Hl),J.updateMatrixWorld(),Mt.makeTranslation(-Zr.x,-Zr.y,-Zr.z),vd.multiplyMatrices(J.projectionMatrix,J.matrixWorldInverse),$._frustum.setFromProjectionMatrix(vd,J.coordinateSystem,J.reversedDepth)}if($.map.isWebGLCubeRenderTarget)s.setRenderTarget($.map,St),s.clear();else{St===0&&(s.setRenderTarget($.map),s.clear());const J=$.getViewport(St);l.set(a.x*J.x,a.y*J.y,a.x*J.z,a.y*J.w),G.viewport(l)}i=$.getFrustum(St),A(x,T,Dt,rt,lt,this.type)}$.isPointLightShadow!==!0&&this.type===Yr&&b($,T),$.needsUpdate=!1}v=this.type,M.needsUpdate=!1,s.setRenderTarget(H,F,k)};function b(E,x){const T=t.update(w);p.defines.VSM_SAMPLES!==E.blurSamples&&(p.defines.VSM_SAMPLES=E.blurSamples,g.defines.VSM_SAMPLES=E.blurSamples,p.needsUpdate=!0,g.needsUpdate=!0),E.mapPass===null?E.mapPass=new vi(r.x,r.y,{format:Os,type:Li}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),p.uniforms.shadow_pass.value=E.map.depthTexture,p.uniforms.resolution.value.set(E.map.width,E.map.height),p.uniforms.radius.value=E.radius,s.setRenderTarget(E.mapPass),s.clear(),s.renderBufferDirect(x,null,T,p,w,null),g.uniforms.shadow_pass.value=E.mapPass.texture,g.uniforms.resolution.value.set(E.map.width,E.map.height),g.uniforms.radius.value=E.radius,s.setRenderTarget(E.map),s.clear(),s.renderBufferDirect(x,null,T,g,w,null)}function I(E,x,T,H){let F=null;const k=T.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(k!==void 0)F=k;else if(F=T.isPointLight===!0?u:h,s.localClippingEnabled&&x.clipShadows===!0&&Array.isArray(x.clippingPlanes)&&x.clippingPlanes.length!==0||x.displacementMap&&x.displacementScale!==0||x.alphaMap&&x.alphaTest>0||x.map&&x.alphaTest>0||x.alphaToCoverage===!0){const G=F.uuid,W=x.uuid;let z=d[G];z===void 0&&(z={},d[G]=z);let j=z[W];j===void 0&&(j=F.clone(),z[W]=j,x.addEventListener("dispose",D)),F=j}if(F.visible=x.visible,F.wireframe=x.wireframe,H===Yr?F.side=x.shadowSide!==null?x.shadowSide:x.side:F.side=x.shadowSide!==null?x.shadowSide:_[x.side],F.alphaMap=x.alphaMap,F.alphaTest=x.alphaToCoverage===!0?.5:x.alphaTest,F.map=x.map,F.clipShadows=x.clipShadows,F.clippingPlanes=x.clippingPlanes,F.clipIntersection=x.clipIntersection,F.displacementMap=x.displacementMap,F.displacementScale=x.displacementScale,F.displacementBias=x.displacementBias,F.wireframeLinewidth=x.wireframeLinewidth,F.linewidth=x.linewidth,T.isPointLight===!0&&F.isMeshDistanceMaterial===!0){const G=s.properties.get(F);G.light=T}return F}function A(E,x,T,H,F,k){if(E.visible===!1)return;if(E.layers.test(F)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&k===Yr)&&(!E.frustumCulled||E.intersectsFrustum(i))){E.modelViewMatrix.multiplyMatrices(T.matrixWorldInverse,E.matrixWorld);const z=t.update(E),j=E.material;if(Array.isArray(j)){const rt=z.groups;for(let $=0,st=rt.length;$<st;$++){const tt=rt[$],Y=j[tt.materialIndex];if(Y&&Y.visible){const lt=I(E,Y,H,k);E.onBeforeShadow(s,E,x,T,z,lt,tt),s.renderBufferDirect(T,null,z,lt,E,tt),E.onAfterShadow(s,E,x,T,z,lt,tt)}}}else if(j.visible){const rt=I(E,j,H,k);E.onBeforeShadow(s,E,x,T,z,rt,null),s.renderBufferDirect(T,null,z,rt,E,null),E.onAfterShadow(s,E,x,T,z,rt,null)}}const W=E.children;for(let z=0,j=W.length;z<j;z++)A(W[z],x,T,H,F,k)}function D(E){E.target.removeEventListener("dispose",D);for(const T in d){const H=d[T],F=E.target.uuid;F in H&&(H[F].dispose(),delete H[F])}}}function bM(s,t){function e(){let B=!1;const at=new Ze;let et=null;const vt=new Ze(0,0,0,0);return{setMask:function(gt){et!==gt&&!B&&(s.colorMask(gt,gt,gt,gt),et=gt)},setLocked:function(gt){B=gt},setClear:function(gt,mt,Ot,Ft,xt){xt===!0&&(gt*=Ft,mt*=Ft,Ot*=Ft),at.set(gt,mt,Ot,Ft),vt.equals(at)===!1&&(s.clearColor(gt,mt,Ot,Ft),vt.copy(at))},reset:function(){B=!1,et=null,vt.set(-1,0,0,0)}}}function i(){let B=!1,at=!1,et=null,vt=null,gt=null;return{setReversed:function(mt){if(at!==mt){const Ot=t.get("EXT_clip_control");mt?Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.ZERO_TO_ONE_EXT):Ot.clipControlEXT(Ot.LOWER_LEFT_EXT,Ot.NEGATIVE_ONE_TO_ONE_EXT),at=mt;const Ft=gt;gt=null,this.setClear(Ft)}},getReversed:function(){return at},setTest:function(mt){mt?Rt(s.DEPTH_TEST):jt(s.DEPTH_TEST)},setMask:function(mt){et!==mt&&!B&&(s.depthMask(mt),et=mt)},setFunc:function(mt){if(at&&(mt=km[mt]),vt!==mt){switch(mt){case Yl:s.depthFunc(s.NEVER);break;case Kl:s.depthFunc(s.ALWAYS);break;case Jl:s.depthFunc(s.LESS);break;case ao:s.depthFunc(s.LEQUAL);break;case Ql:s.depthFunc(s.EQUAL);break;case jl:s.depthFunc(s.GEQUAL);break;case tc:s.depthFunc(s.GREATER);break;case ec:s.depthFunc(s.NOTEQUAL);break;default:s.depthFunc(s.LEQUAL)}vt=mt}},setLocked:function(mt){B=mt},setClear:function(mt){gt!==mt&&(gt=mt,at&&(mt=1-mt),s.clearDepth(mt))},reset:function(){B=!1,et=null,vt=null,gt=null,at=!1}}}function r(){let B=!1,at=null,et=null,vt=null,gt=null,mt=null,Ot=null,Ft=null,xt=null;return{setTest:function(kt){B||(kt?Rt(s.STENCIL_TEST):jt(s.STENCIL_TEST))},setMask:function(kt){at!==kt&&!B&&(s.stencilMask(kt),at=kt)},setFunc:function(kt,qt,Pt){(et!==kt||vt!==qt||gt!==Pt)&&(s.stencilFunc(kt,qt,Pt),et=kt,vt=qt,gt=Pt)},setOp:function(kt,qt,Pt){(mt!==kt||Ot!==qt||Ft!==Pt)&&(s.stencilOp(kt,qt,Pt),mt=kt,Ot=qt,Ft=Pt)},setLocked:function(kt){B=kt},setClear:function(kt){xt!==kt&&(s.clearStencil(kt),xt=kt)},reset:function(){B=!1,at=null,et=null,vt=null,gt=null,mt=null,Ot=null,Ft=null,xt=null}}}const a=new e,l=new i,h=new r;let u={};const d=new WeakMap;let m={},_={},p={},g=new WeakMap,y=[],w=null,M=!1,v=null,b=null,I=null,A=null,D=null,E=null,x=null,T=new Qt(0,0,0),H=0,F=!1,k=null,G=null,W=null,z=null,j=null;const rt=s.getParameter(s.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let $=!1,st=0;const tt=s.getParameter(s.VERSION);tt.indexOf("WebGL")!==-1?(st=parseFloat(/^WebGL (\d)/.exec(tt)[1]),$=st>=1):tt.indexOf("OpenGL ES")!==-1&&(st=parseFloat(/^OpenGL ES (\d)/.exec(tt)[1]),$=st>=2);let Y=null,lt={};const St=s.getParameter(s.SCISSOR_BOX),Dt=s.getParameter(s.VIEWPORT),J=new Ze().fromArray(St),Mt=new Ze().fromArray(Dt);function yt(B,at,et,vt){const gt=new Uint8Array(4),mt=s.createTexture();s.bindTexture(B,mt),s.texParameteri(B,s.TEXTURE_MIN_FILTER,s.NEAREST),s.texParameteri(B,s.TEXTURE_MAG_FILTER,s.NEAREST);for(let Ot=0;Ot<et;Ot++)B===s.TEXTURE_3D||B===s.TEXTURE_2D_ARRAY?s.texImage3D(at,0,s.RGBA,1,1,vt,0,s.RGBA,s.UNSIGNED_BYTE,gt):s.texImage2D(at+Ot,0,s.RGBA,1,1,0,s.RGBA,s.UNSIGNED_BYTE,gt);return mt}const Wt={};Wt[s.TEXTURE_2D]=yt(s.TEXTURE_2D,s.TEXTURE_2D,1),Wt[s.TEXTURE_CUBE_MAP]=yt(s.TEXTURE_CUBE_MAP,s.TEXTURE_CUBE_MAP_POSITIVE_X,6),Wt[s.TEXTURE_2D_ARRAY]=yt(s.TEXTURE_2D_ARRAY,s.TEXTURE_2D_ARRAY,1,1),Wt[s.TEXTURE_3D]=yt(s.TEXTURE_3D,s.TEXTURE_3D,1,1),a.setClear(0,0,0,1),l.setClear(1),h.setClear(0),Rt(s.DEPTH_TEST),l.setFunc(ao),Qe(!1),Re(mu),Rt(s.CULL_FACE),We(vr);function Rt(B){m[B]!==!0&&(s.enable(B),m[B]=!0)}function jt(B){m[B]!==!1&&(s.disable(B),m[B]=!1)}function we(B,at){return p[B]!==at?(s.bindFramebuffer(B,at),p[B]=at,B===s.DRAW_FRAMEBUFFER&&(p[s.FRAMEBUFFER]=at),B===s.FRAMEBUFFER&&(p[s.DRAW_FRAMEBUFFER]=at),!0):!1}function Jt(B,at){let et=y,vt=!1;if(B){et=g.get(at),et===void 0&&(et=[],g.set(at,et));const gt=B.textures;if(et.length!==gt.length||et[0]!==s.COLOR_ATTACHMENT0){for(let mt=0,Ot=gt.length;mt<Ot;mt++)et[mt]=s.COLOR_ATTACHMENT0+mt;et.length=gt.length,vt=!0}}else et[0]!==s.BACK&&(et[0]=s.BACK,vt=!0);vt&&s.drawBuffers(et)}function fe(B){return w!==B?(s.useProgram(B),w=B,!0):!1}const ve={[_r]:s.FUNC_ADD,[lm]:s.FUNC_SUBTRACT,[cm]:s.FUNC_REVERSE_SUBTRACT};ve[hm]=s.MIN,ve[um]=s.MAX;const ce={[dm]:s.ZERO,[fm]:s.ONE,[pm]:s.SRC_COLOR,[Zd]:s.SRC_ALPHA,[Mm]:s.SRC_ALPHA_SATURATE,[vm]:s.DST_COLOR,[_m]:s.DST_ALPHA,[mm]:s.ONE_MINUS_SRC_COLOR,[qd]:s.ONE_MINUS_SRC_ALPHA,[xm]:s.ONE_MINUS_DST_COLOR,[gm]:s.ONE_MINUS_DST_ALPHA,[ym]:s.CONSTANT_COLOR,[Sm]:s.ONE_MINUS_CONSTANT_COLOR,[wm]:s.CONSTANT_ALPHA,[bm]:s.ONE_MINUS_CONSTANT_ALPHA};function We(B,at,et,vt,gt,mt,Ot,Ft,xt,kt){if(B===vr){M===!0&&(jt(s.BLEND),M=!1);return}if(M===!1&&(Rt(s.BLEND),M=!0),B!==am){if(B!==v||kt!==F){if((b!==_r||D!==_r)&&(s.blendEquation(s.FUNC_ADD),b=_r,D=_r),kt)switch(B){case to:s.blendFuncSeparate(s.ONE,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case _u:s.blendFunc(s.ONE,s.ONE);break;case gu:s.blendFuncSeparate(s.ZERO,s.ONE_MINUS_SRC_COLOR,s.ZERO,s.ONE);break;case vu:s.blendFuncSeparate(s.DST_COLOR,s.ONE_MINUS_SRC_ALPHA,s.ZERO,s.ONE);break;default:Te("WebGLState: Invalid blending: ",B);break}else switch(B){case to:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE_MINUS_SRC_ALPHA,s.ONE,s.ONE_MINUS_SRC_ALPHA);break;case _u:s.blendFuncSeparate(s.SRC_ALPHA,s.ONE,s.ONE,s.ONE);break;case gu:Te("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case vu:Te("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Te("WebGLState: Invalid blending: ",B);break}I=null,A=null,E=null,x=null,T.set(0,0,0),H=0,v=B,F=kt}return}gt=gt||at,mt=mt||et,Ot=Ot||vt,(at!==b||gt!==D)&&(s.blendEquationSeparate(ve[at],ve[gt]),b=at,D=gt),(et!==I||vt!==A||mt!==E||Ot!==x)&&(s.blendFuncSeparate(ce[et],ce[vt],ce[mt],ce[Ot]),I=et,A=vt,E=mt,x=Ot),(Ft.equals(T)===!1||xt!==H)&&(s.blendColor(Ft.r,Ft.g,Ft.b,xt),T.copy(Ft),H=xt),v=B,F=!1}function He(B,at){B.side===$n?jt(s.CULL_FACE):Rt(s.CULL_FACE);let et=B.side===zn;at&&(et=!et),Qe(et),B.blending===to&&B.transparent===!1?We(vr):We(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),l.setFunc(B.depthFunc),l.setTest(B.depthTest),l.setMask(B.depthWrite),a.setMask(B.colorWrite);const vt=B.stencilWrite;h.setTest(vt),vt&&(h.setMask(B.stencilWriteMask),h.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),h.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),ze(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?Rt(s.SAMPLE_ALPHA_TO_COVERAGE):jt(s.SAMPLE_ALPHA_TO_COVERAGE)}function Qe(B){k!==B&&(B?s.frontFace(s.CW):s.frontFace(s.CCW),k=B)}function Re(B){B!==sm?(Rt(s.CULL_FACE),B!==G&&(B===mu?s.cullFace(s.BACK):B===rm?s.cullFace(s.FRONT):s.cullFace(s.FRONT_AND_BACK))):jt(s.CULL_FACE),G=B}function Ln(B){B!==W&&($&&s.lineWidth(B),W=B)}function ze(B,at,et){B?(Rt(s.POLYGON_OFFSET_FILL),(z!==at||j!==et)&&(z=at,j=et,l.getReversed()&&(at=-at,et=-et),s.polygonOffset(at,et))):jt(s.POLYGON_OFFSET_FILL)}function je(B){B?Rt(s.SCISSOR_TEST):jt(s.SCISSOR_TEST)}function fn(B){B===void 0&&(B=s.TEXTURE0+rt-1),Y!==B&&(s.activeTexture(B),Y=B)}function Sn(B,at,et){et===void 0&&(Y===null?et=s.TEXTURE0+rt-1:et=Y);let vt=lt[et];vt===void 0&&(vt={type:void 0,texture:void 0},lt[et]=vt),(vt.type!==B||vt.texture!==at)&&(Y!==et&&(s.activeTexture(et),Y=et),s.bindTexture(B,at||Wt[B]),vt.type=B,vt.texture=at)}function K(){const B=lt[Y];B!==void 0&&B.type!==void 0&&(s.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function tn(){try{s.compressedTexImage2D(...arguments)}catch(B){Te("WebGLState:",B)}}function Pe(){try{s.compressedTexImage3D(...arguments)}catch(B){Te("WebGLState:",B)}}function Ie(){try{s.texSubImage2D(...arguments)}catch(B){Te("WebGLState:",B)}}function Ct(){try{s.texSubImage3D(...arguments)}catch(B){Te("WebGLState:",B)}}function ke(){try{s.compressedTexSubImage2D(...arguments)}catch(B){Te("WebGLState:",B)}}function Yt(){try{s.compressedTexSubImage3D(...arguments)}catch(B){Te("WebGLState:",B)}}function te(){try{s.texStorage2D(...arguments)}catch(B){Te("WebGLState:",B)}}function O(){try{s.texStorage3D(...arguments)}catch(B){Te("WebGLState:",B)}}function R(){try{s.texImage2D(...arguments)}catch(B){Te("WebGLState:",B)}}function ht(){try{s.texImage3D(...arguments)}catch(B){Te("WebGLState:",B)}}function N(B){return _[B]!==void 0?_[B]:s.getParameter(B)}function U(B,at){_[B]!==at&&(s.pixelStorei(B,at),_[B]=at)}function X(B){J.equals(B)===!1&&(s.scissor(B.x,B.y,B.z,B.w),J.copy(B))}function it(B){Mt.equals(B)===!1&&(s.viewport(B.x,B.y,B.z,B.w),Mt.copy(B))}function q(B,at){let et=d.get(at);et===void 0&&(et=new WeakMap,d.set(at,et));let vt=et.get(B);vt===void 0&&(vt=s.getUniformBlockIndex(at,B.name),s.uniformBlockBinding(at,vt,vt),et.set(B,vt))}function ot(B,at,et){const gt=d.get(at).get(B);u[gt]!==et&&(s.bindBufferBase(s.UNIFORM_BUFFER,gt,et),u[gt]=et)}function _t(){s.disable(s.BLEND),s.disable(s.CULL_FACE),s.disable(s.DEPTH_TEST),s.disable(s.POLYGON_OFFSET_FILL),s.disable(s.SCISSOR_TEST),s.disable(s.STENCIL_TEST),s.disable(s.SAMPLE_ALPHA_TO_COVERAGE),s.blendEquation(s.FUNC_ADD),s.blendFunc(s.ONE,s.ZERO),s.blendFuncSeparate(s.ONE,s.ZERO,s.ONE,s.ZERO),s.blendColor(0,0,0,0),s.colorMask(!0,!0,!0,!0),s.clearColor(0,0,0,0),s.depthMask(!0),s.depthFunc(s.LESS),l.setReversed(!1),s.clearDepth(1),s.stencilMask(4294967295),s.stencilFunc(s.ALWAYS,0,4294967295),s.stencilOp(s.KEEP,s.KEEP,s.KEEP),s.clearStencil(0),s.cullFace(s.BACK),s.frontFace(s.CCW),s.polygonOffset(0,0),s.activeTexture(s.TEXTURE0),s.bindFramebuffer(s.FRAMEBUFFER,null),s.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),s.bindFramebuffer(s.READ_FRAMEBUFFER,null),s.useProgram(null),s.lineWidth(1),s.scissor(0,0,s.canvas.width,s.canvas.height),s.viewport(0,0,s.canvas.width,s.canvas.height),s.pixelStorei(s.PACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_ALIGNMENT,4),s.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,!1),s.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),s.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,s.BROWSER_DEFAULT_WEBGL),s.pixelStorei(s.PACK_ROW_LENGTH,0),s.pixelStorei(s.PACK_SKIP_PIXELS,0),s.pixelStorei(s.PACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_ROW_LENGTH,0),s.pixelStorei(s.UNPACK_IMAGE_HEIGHT,0),s.pixelStorei(s.UNPACK_SKIP_PIXELS,0),s.pixelStorei(s.UNPACK_SKIP_ROWS,0),s.pixelStorei(s.UNPACK_SKIP_IMAGES,0),m={},_={},Y=null,lt={},p={},u={},g=new WeakMap,y=[],w=null,M=!1,v=null,b=null,I=null,A=null,D=null,E=null,x=null,T=new Qt(0,0,0),H=0,F=!1,k=null,G=null,W=null,z=null,j=null,J.set(0,0,s.canvas.width,s.canvas.height),Mt.set(0,0,s.canvas.width,s.canvas.height),a.reset(),l.reset(),h.reset()}return{buffers:{color:a,depth:l,stencil:h},enable:Rt,disable:jt,bindFramebuffer:we,drawBuffers:Jt,useProgram:fe,setBlending:We,setMaterial:He,setFlipSided:Qe,setCullFace:Re,setLineWidth:Ln,setPolygonOffset:ze,setScissorTest:je,activeTexture:fn,bindTexture:Sn,unbindTexture:K,compressedTexImage2D:tn,compressedTexImage3D:Pe,texImage2D:R,texImage3D:ht,pixelStorei:U,getParameter:N,updateUBOMapping:q,uniformBlockBinding:ot,texStorage2D:te,texStorage3D:O,texSubImage2D:Ie,texSubImage3D:Ct,compressedTexSubImage2D:ke,compressedTexSubImage3D:Yt,scissor:X,viewport:it,reset:_t}}function EM(s,t,e,i,r,a,l){const h=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,u=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),d=new le,m=new WeakMap,_=new Set;let p;const g=new WeakMap,y=new Set,w=new FinalizationRegistry(O=>y.delete(O));let M=!1;try{M=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(O,R){return M?new OffscreenCanvas(O,R):fo("canvas")}function b(O,R,ht){let N=1;const U=te(O);if((U.width>ht||U.height>ht)&&(N=ht/Math.max(U.width,U.height)),N<1)if(typeof HTMLImageElement<"u"&&O instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&O instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&O instanceof ImageBitmap||typeof VideoFrame<"u"&&O instanceof VideoFrame){const X=Math.floor(N*U.width),it=Math.floor(N*U.height);p===void 0&&(p=v(X,it));const q=R?v(X,it):p;return q.width=X,q.height=it,q.getContext("2d").drawImage(O,0,0,X,it),re("WebGLRenderer: Texture has been resized from ("+U.width+"x"+U.height+") to ("+X+"x"+it+")."),q}else return"data"in O&&re("WebGLRenderer: Image in DataTexture is too big ("+U.width+"x"+U.height+")."),O;return O}function I(O){return O.generateMipmaps}function A(O){s.generateMipmap(O)}function D(O){return O.isWebGLCubeRenderTarget?s.TEXTURE_CUBE_MAP:O.isWebGL3DRenderTarget?s.TEXTURE_3D:O.isWebGLArrayRenderTarget||O.isCompressedArrayTexture?s.TEXTURE_2D_ARRAY:s.TEXTURE_2D}function E(O,R,ht,N,U,X=!1){if(O!==null){if(s[O]!==void 0)return s[O];re("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+O+"'")}let it;N&&(it=t.get("EXT_texture_norm16"),it||re("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let q=R;if(R===s.RED&&(ht===s.FLOAT&&(q=s.R32F),ht===s.HALF_FLOAT&&(q=s.R16F),ht===s.UNSIGNED_BYTE&&(q=s.R8),ht===s.UNSIGNED_SHORT&&it&&(q=it.R16_EXT),ht===s.SHORT&&it&&(q=it.R16_SNORM_EXT)),R===s.RED_INTEGER&&(ht===s.UNSIGNED_BYTE&&(q=s.R8UI),ht===s.UNSIGNED_SHORT&&(q=s.R16UI),ht===s.UNSIGNED_INT&&(q=s.R32UI),ht===s.BYTE&&(q=s.R8I),ht===s.SHORT&&(q=s.R16I),ht===s.INT&&(q=s.R32I)),R===s.RG&&(ht===s.FLOAT&&(q=s.RG32F),ht===s.HALF_FLOAT&&(q=s.RG16F),ht===s.UNSIGNED_BYTE&&(q=s.RG8),ht===s.UNSIGNED_SHORT&&it&&(q=it.RG16_EXT),ht===s.SHORT&&it&&(q=it.RG16_SNORM_EXT)),R===s.RG_INTEGER&&(ht===s.UNSIGNED_BYTE&&(q=s.RG8UI),ht===s.UNSIGNED_SHORT&&(q=s.RG16UI),ht===s.UNSIGNED_INT&&(q=s.RG32UI),ht===s.BYTE&&(q=s.RG8I),ht===s.SHORT&&(q=s.RG16I),ht===s.INT&&(q=s.RG32I)),R===s.RGB_INTEGER&&(ht===s.UNSIGNED_BYTE&&(q=s.RGB8UI),ht===s.UNSIGNED_SHORT&&(q=s.RGB16UI),ht===s.UNSIGNED_INT&&(q=s.RGB32UI),ht===s.BYTE&&(q=s.RGB8I),ht===s.SHORT&&(q=s.RGB16I),ht===s.INT&&(q=s.RGB32I)),R===s.RGBA_INTEGER&&(ht===s.UNSIGNED_BYTE&&(q=s.RGBA8UI),ht===s.UNSIGNED_SHORT&&(q=s.RGBA16UI),ht===s.UNSIGNED_INT&&(q=s.RGBA32UI),ht===s.BYTE&&(q=s.RGBA8I),ht===s.SHORT&&(q=s.RGBA16I),ht===s.INT&&(q=s.RGBA32I)),R===s.RGB&&(ht===s.UNSIGNED_SHORT&&it&&(q=it.RGB16_EXT),ht===s.SHORT&&it&&(q=it.RGB16_SNORM_EXT),ht===s.UNSIGNED_INT_5_9_9_9_REV&&(q=s.RGB9_E5),ht===s.UNSIGNED_INT_10F_11F_11F_REV&&(q=s.R11F_G11F_B10F)),R===s.RGBA){const ot=X?Ra:xe.getTransfer(U);ht===s.FLOAT&&(q=s.RGBA32F),ht===s.HALF_FLOAT&&(q=s.RGBA16F),ht===s.UNSIGNED_BYTE&&(q=ot===De?s.SRGB8_ALPHA8:s.RGBA8),ht===s.UNSIGNED_SHORT&&it&&(q=it.RGBA16_EXT),ht===s.SHORT&&it&&(q=it.RGBA16_SNORM_EXT),ht===s.UNSIGNED_SHORT_4_4_4_4&&(q=s.RGBA4),ht===s.UNSIGNED_SHORT_5_5_5_1&&(q=s.RGB5_A1)}return(q===s.R16F||q===s.R32F||q===s.RG16F||q===s.RG32F||q===s.RGBA16F||q===s.RGBA32F)&&t.get("EXT_color_buffer_float"),q}function x(O,R){let ht;return O?R===null||R===Ci||R===Sr?ht=s.DEPTH24_STENCIL8:R===pi?ht=s.DEPTH32F_STENCIL8:R===co&&(ht=s.DEPTH24_STENCIL8,re("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):R===null||R===Ci||R===Sr?ht=s.DEPTH_COMPONENT24:R===pi?ht=s.DEPTH_COMPONENT32F:R===co&&(ht=s.DEPTH_COMPONENT16),ht}function T(O,R){return I(O)===!0||O.isFramebufferTexture&&O.minFilter!==rn&&O.minFilter!==On?Math.log2(Math.max(R.width,R.height))+1:O.mipmaps.length>0?O.mipmaps.length:O.isCompressedTexture&&Array.isArray(O.image)?R.mipmaps.length:1}function H(O){const R=new WeakRef(O);i.get(O).__ref=R,y.add(R),w.register(O,R,R)}function F(O){const R=i.get(O).__ref;R!==void 0&&(y.delete(R),w.unregister(R))}function k(O){W(O.target)}function G(O){z(O.target)}function W(O){O.removeEventListener("dispose",k),F(O),rt(O),O.isVideoTexture&&m.delete(O),O.isHTMLTexture&&_.delete(O)}function z(O){O.removeEventListener("dispose",G),F(O),st(O)}function j(){for(const O of y){const R=O.deref();R!==void 0&&(R.isRenderTarget===!0?z(R):W(R))}y.clear(),_.clear()}function rt(O){const R=i.get(O);if(R.__webglInit===void 0)return;const ht=O.source,N=g.get(ht);if(N){const U=N[R.__cacheKey];U.usedTimes--,U.usedTimes===0&&$(O),Object.keys(N).length===0&&g.delete(ht)}i.remove(O)}function $(O){const R=i.get(O);s.deleteTexture(R.__webglTexture);const ht=O.source,N=g.get(ht);delete N[R.__cacheKey],l.memory.textures--}function st(O){const R=i.get(O);R.__depthDisposeCallback&&R.__depthDisposeCallback();const ht=O.depthTexture;if(ht&&ht.renderTarget===O&&W(ht),O.isWebGLCubeRenderTarget)for(let U=0;U<6;U++){if(Array.isArray(R.__webglFramebuffer[U]))for(let X=0;X<R.__webglFramebuffer[U].length;X++)s.deleteFramebuffer(R.__webglFramebuffer[U][X]);else s.deleteFramebuffer(R.__webglFramebuffer[U]);R.__webglDepthbuffer&&s.deleteRenderbuffer(R.__webglDepthbuffer[U])}else{if(Array.isArray(R.__webglFramebuffer))for(let U=0;U<R.__webglFramebuffer.length;U++)s.deleteFramebuffer(R.__webglFramebuffer[U]);else s.deleteFramebuffer(R.__webglFramebuffer);if(R.__webglDepthbuffer&&s.deleteRenderbuffer(R.__webglDepthbuffer),R.__webglMultisampledFramebuffer&&s.deleteFramebuffer(R.__webglMultisampledFramebuffer),R.__webglColorRenderbuffer)for(let U=0;U<R.__webglColorRenderbuffer.length;U++)R.__webglColorRenderbuffer[U]&&s.deleteRenderbuffer(R.__webglColorRenderbuffer[U]);R.__webglDepthRenderbuffer&&s.deleteRenderbuffer(R.__webglDepthRenderbuffer)}const N=O.textures;for(let U=0,X=N.length;U<X;U++){const it=i.get(N[U]);it.__webglTexture&&(s.deleteTexture(it.__webglTexture),l.memory.textures--),i.remove(N[U])}i.remove(O)}let tt=0;function Y(){tt=0}function lt(){return tt}function St(O){tt=O}function Dt(){const O=tt;return O>=r.maxTextures&&re("WebGLTextures: Trying to use "+(O+1)+" texture units while this GPU supports only "+r.maxTextures),tt+=1,O}function J(O){const R=[];return R.push(O.wrapS),R.push(O.wrapT),R.push(O.wrapR||0),R.push(O.magFilter),R.push(O.minFilter),R.push(O.anisotropy),R.push(O.internalFormat),R.push(O.format),R.push(O.type),R.push(O.generateMipmaps),R.push(O.mipmapsAutoUpdate),R.push(O.premultiplyAlpha),R.push(O.flipY),R.push(O.unpackAlignment),R.push(O.colorSpace),R.join()}function Mt(O,R){const ht=i.get(O);if(O.isVideoTexture&&ke(O),O.isRenderTargetTexture===!1&&O.isExternalTexture!==!0&&O.version>0&&ht.__version!==O.version){const N=O.image;if(N===null)re("WebGLRenderer: Texture marked for update but no image data found.");else if(N.complete===!1)re("WebGLRenderer: Texture marked for update but image is incomplete");else{He(ht,O,R);return}}else O.isExternalTexture&&(ht.__webglTexture=O.sourceTexture?O.sourceTexture:null);e.bindTexture(s.TEXTURE_2D,ht.__webglTexture,s.TEXTURE0+R)}function yt(O,R){const ht=i.get(O);if(O.isRenderTargetTexture===!1&&O.version>0&&ht.__version!==O.version){He(ht,O,R);return}else O.isExternalTexture&&(ht.__webglTexture=O.sourceTexture?O.sourceTexture:null);e.bindTexture(s.TEXTURE_2D_ARRAY,ht.__webglTexture,s.TEXTURE0+R)}function Wt(O,R){const ht=i.get(O);if(O.isRenderTargetTexture===!1&&O.version>0&&ht.__version!==O.version){He(ht,O,R);return}e.bindTexture(s.TEXTURE_3D,ht.__webglTexture,s.TEXTURE0+R)}function Rt(O,R){const ht=i.get(O);if(O.version>0&&ht.__version!==O.version){Qe(ht,O,R);return}e.bindTexture(s.TEXTURE_CUBE_MAP,ht.__webglTexture,s.TEXTURE0+R)}const jt={[nc]:s.REPEAT,[Yi]:s.CLAMP_TO_EDGE,[ic]:s.MIRRORED_REPEAT},we={[rn]:s.NEAREST,[Am]:s.NEAREST_MIPMAP_NEAREST,[ko]:s.NEAREST_MIPMAP_LINEAR,[On]:s.LINEAR,[ml]:s.LINEAR_MIPMAP_NEAREST,[Ki]:s.LINEAR_MIPMAP_LINEAR},Jt={[Lm]:s.NEVER,[uf]:s.ALWAYS,[Im]:s.LESS,[cf]:s.LEQUAL,[Dm]:s.EQUAL,[hf]:s.GEQUAL,[Nm]:s.GREATER,[Fm]:s.NOTEQUAL};function fe(O,R){if(R.type===pi&&t.has("OES_texture_float_linear")===!1&&(R.magFilter===On||R.magFilter===ml||R.magFilter===ko||R.magFilter===Ki||R.minFilter===On||R.minFilter===ml||R.minFilter===ko||R.minFilter===Ki)&&re("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),s.texParameteri(O,s.TEXTURE_WRAP_S,jt[R.wrapS]),s.texParameteri(O,s.TEXTURE_WRAP_T,jt[R.wrapT]),(O===s.TEXTURE_3D||O===s.TEXTURE_2D_ARRAY)&&s.texParameteri(O,s.TEXTURE_WRAP_R,jt[R.wrapR]),s.texParameteri(O,s.TEXTURE_MAG_FILTER,we[R.magFilter]),s.texParameteri(O,s.TEXTURE_MIN_FILTER,we[R.minFilter]),R.compareFunction&&(s.texParameteri(O,s.TEXTURE_COMPARE_MODE,s.COMPARE_REF_TO_TEXTURE),s.texParameteri(O,s.TEXTURE_COMPARE_FUNC,Jt[R.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(R.magFilter===rn||R.minFilter!==ko&&R.minFilter!==Ki||R.type===pi&&t.has("OES_texture_float_linear")===!1)return;if(R.anisotropy>1||i.get(R).__currentAnisotropy){const ht=t.get("EXT_texture_filter_anisotropic");s.texParameterf(O,ht.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(R.anisotropy,r.getMaxAnisotropy())),i.get(R).__currentAnisotropy=R.anisotropy}}}function ve(O,R){let ht=!1;O.__webglInit===void 0&&(O.__webglInit=!0,R.addEventListener("dispose",k),H(R));const N=R.source;let U=g.get(N);U===void 0&&(U={},g.set(N,U));const X=J(R);if(X!==O.__cacheKey){U[X]===void 0&&(U[X]={texture:s.createTexture(),usedTimes:0},l.memory.textures++,ht=!0),U[X].usedTimes++;const it=U[O.__cacheKey];it!==void 0&&(U[O.__cacheKey].usedTimes--,it.usedTimes===0&&$(R)),O.__cacheKey=X,O.__webglTexture=U[X].texture}return ht}function ce(O,R,ht){return Math.floor(Math.floor(O/ht)/R)}function We(O,R,ht,N){const X=O.updateRanges;if(X.length===0)e.texSubImage2D(s.TEXTURE_2D,0,0,0,R.width,R.height,ht,N,R.data);else{X.sort((B,at)=>B.start-at.start);let it=0;for(let B=1;B<X.length;B++){const at=X[it],et=X[B],vt=at.start+at.count,gt=ce(et.start,R.width,4),mt=ce(at.start,R.width,4);et.start<=vt+1&&gt===mt&&ce(et.start+et.count-1,R.width,4)===gt?at.count=Math.max(at.count,et.start+et.count-at.start):(++it,X[it]=et)}X.length=it+1;const q=e.getParameter(s.UNPACK_ROW_LENGTH),ot=e.getParameter(s.UNPACK_SKIP_PIXELS),_t=e.getParameter(s.UNPACK_SKIP_ROWS);e.pixelStorei(s.UNPACK_ROW_LENGTH,R.width);for(let B=0,at=X.length;B<at;B++){const et=X[B],vt=Math.floor(et.start/4),gt=Math.ceil(et.count/4),mt=vt%R.width,Ot=Math.floor(vt/R.width),Ft=gt,xt=1;e.pixelStorei(s.UNPACK_SKIP_PIXELS,mt),e.pixelStorei(s.UNPACK_SKIP_ROWS,Ot),e.texSubImage2D(s.TEXTURE_2D,0,mt,Ot,Ft,xt,ht,N,R.data)}O.clearUpdateRanges(),e.pixelStorei(s.UNPACK_ROW_LENGTH,q),e.pixelStorei(s.UNPACK_SKIP_PIXELS,ot),e.pixelStorei(s.UNPACK_SKIP_ROWS,_t)}}function He(O,R,ht){let N=s.TEXTURE_2D;(R.isDataArrayTexture||R.isCompressedArrayTexture)&&(N=s.TEXTURE_2D_ARRAY),R.isData3DTexture&&(N=s.TEXTURE_3D);const U=ve(O,R),X=R.source;e.bindTexture(N,O.__webglTexture,s.TEXTURE0+ht);const it=i.get(X);if(X.version!==it.__version||U===!0){if(e.activeTexture(s.TEXTURE0+ht),(typeof ImageBitmap<"u"&&R.image instanceof ImageBitmap)===!1){const xt=xe.getPrimaries(xe.workingColorSpace),kt=R.colorSpace===ds?null:xe.getPrimaries(R.colorSpace),qt=R.colorSpace===ds||xt===kt?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,R.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,qt)}e.pixelStorei(s.UNPACK_ALIGNMENT,R.unpackAlignment);let ot=b(R.image,!1,r.maxTextureSize);ot=Yt(R,ot);const _t=a.convert(R.format,R.colorSpace),B=a.convert(R.type);let at=E(R.internalFormat,_t,B,R.normalized,R.colorSpace,R.isVideoTexture);fe(N,R);let et;const vt=R.mipmaps,gt=R.isVideoTexture!==!0,mt=it.__version===void 0||U===!0,Ot=X.dataReady,Ft=T(R,ot);if(R.isDepthTexture)at=x(R.format===fs,R.type),mt&&(gt?e.texStorage2D(s.TEXTURE_2D,1,at,ot.width,ot.height):e.texImage2D(s.TEXTURE_2D,0,at,ot.width,ot.height,0,_t,B,null));else if(R.isDataTexture)if(vt.length>0){gt&&mt&&e.texStorage2D(s.TEXTURE_2D,Ft,at,vt[0].width,vt[0].height);for(let xt=0,kt=vt.length;xt<kt;xt++)et=vt[xt],gt?Ot&&e.texSubImage2D(s.TEXTURE_2D,xt,0,0,et.width,et.height,_t,B,et.data):e.texImage2D(s.TEXTURE_2D,xt,at,et.width,et.height,0,_t,B,et.data);R.generateMipmaps=!1}else gt?(mt&&e.texStorage2D(s.TEXTURE_2D,Ft,at,ot.width,ot.height),Ot&&We(R,ot,_t,B)):e.texImage2D(s.TEXTURE_2D,0,at,ot.width,ot.height,0,_t,B,ot.data);else if(R.isCompressedTexture)if(R.isCompressedArrayTexture){gt&&mt&&e.texStorage3D(s.TEXTURE_2D_ARRAY,Ft,at,vt[0].width,vt[0].height,ot.depth);for(let xt=0,kt=vt.length;xt<kt;xt++)if(et=vt[xt],R.format!==Ai)if(_t!==null)if(gt){if(Ot)if(R.layerUpdates.size>0){const qt=Ju(et.width,et.height,R.format,R.type);for(const Pt of R.layerUpdates){const ne=et.data.subarray(Pt*qt/et.data.BYTES_PER_ELEMENT,(Pt+1)*qt/et.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,xt,0,0,Pt,et.width,et.height,1,_t,ne)}}else e.compressedTexSubImage3D(s.TEXTURE_2D_ARRAY,xt,0,0,0,et.width,et.height,ot.depth,_t,et.data)}else e.compressedTexImage3D(s.TEXTURE_2D_ARRAY,xt,at,et.width,et.height,ot.depth,0,et.data,0,0);else re("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else gt?Ot&&e.texSubImage3D(s.TEXTURE_2D_ARRAY,xt,0,0,0,et.width,et.height,ot.depth,_t,B,et.data):e.texImage3D(s.TEXTURE_2D_ARRAY,xt,at,et.width,et.height,ot.depth,0,_t,B,et.data);R.layerUpdates.size>0&&R.clearLayerUpdates()}else{gt&&mt&&e.texStorage2D(s.TEXTURE_2D,Ft,at,vt[0].width,vt[0].height);for(let xt=0,kt=vt.length;xt<kt;xt++)et=vt[xt],R.format!==Ai?_t!==null?gt?Ot&&e.compressedTexSubImage2D(s.TEXTURE_2D,xt,0,0,et.width,et.height,_t,et.data):e.compressedTexImage2D(s.TEXTURE_2D,xt,at,et.width,et.height,0,et.data):re("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):gt?Ot&&e.texSubImage2D(s.TEXTURE_2D,xt,0,0,et.width,et.height,_t,B,et.data):e.texImage2D(s.TEXTURE_2D,xt,at,et.width,et.height,0,_t,B,et.data)}else if(R.isDataArrayTexture)if(gt){if(mt&&e.texStorage3D(s.TEXTURE_2D_ARRAY,Ft,at,ot.width,ot.height,ot.depth),Ot)if(R.layerUpdates.size>0){const xt=Ju(ot.width,ot.height,R.format,R.type);for(const kt of R.layerUpdates){const qt=ot.data.subarray(kt*xt/ot.data.BYTES_PER_ELEMENT,(kt+1)*xt/ot.data.BYTES_PER_ELEMENT);e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,kt,ot.width,ot.height,1,_t,B,qt)}R.clearLayerUpdates()}else e.texSubImage3D(s.TEXTURE_2D_ARRAY,0,0,0,0,ot.width,ot.height,ot.depth,_t,B,ot.data)}else e.texImage3D(s.TEXTURE_2D_ARRAY,0,at,ot.width,ot.height,ot.depth,0,_t,B,ot.data);else if(R.isData3DTexture)gt?(mt&&e.texStorage3D(s.TEXTURE_3D,Ft,at,ot.width,ot.height,ot.depth),Ot&&e.texSubImage3D(s.TEXTURE_3D,0,0,0,0,ot.width,ot.height,ot.depth,_t,B,ot.data)):e.texImage3D(s.TEXTURE_3D,0,at,ot.width,ot.height,ot.depth,0,_t,B,ot.data);else if(R.isFramebufferTexture){if(mt)if(gt)e.texStorage2D(s.TEXTURE_2D,Ft,at,ot.width,ot.height);else{let xt=ot.width,kt=ot.height;for(let qt=0;qt<Ft;qt++)e.texImage2D(s.TEXTURE_2D,qt,at,xt,kt,0,_t,B,null),xt>>=1,kt>>=1}}else if(R.isHTMLTexture){if("texElementImage2D"in s){const xt=s.canvas;if(xt.hasAttribute("layoutsubtree")||xt.setAttribute("layoutsubtree","true"),ot.parentNode!==xt){xt.appendChild(ot),_.add(R),xt.onpaint=kt=>{const qt=kt.changedElements;for(const Pt of _)qt.includes(Pt.image)&&(Pt.needsUpdate=!0)},xt.requestPaint();return}if(s.texElementImage2D.length===3)s.texElementImage2D(s.TEXTURE_2D,s.RGBA8,ot);else{const qt=s.RGBA,Pt=s.RGBA,ne=s.UNSIGNED_BYTE;s.texElementImage2D(s.TEXTURE_2D,0,qt,Pt,ne,ot)}s.texParameteri(s.TEXTURE_2D,s.TEXTURE_MIN_FILTER,s.LINEAR),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_S,s.CLAMP_TO_EDGE),s.texParameteri(s.TEXTURE_2D,s.TEXTURE_WRAP_T,s.CLAMP_TO_EDGE)}}else if(vt.length>0){if(gt&&mt){const xt=te(vt[0]);e.texStorage2D(s.TEXTURE_2D,Ft,at,xt.width,xt.height)}for(let xt=0,kt=vt.length;xt<kt;xt++)et=vt[xt],gt?Ot&&e.texSubImage2D(s.TEXTURE_2D,xt,0,0,_t,B,et):e.texImage2D(s.TEXTURE_2D,xt,at,_t,B,et);R.generateMipmaps=!1}else if(gt){if(mt){const xt=te(ot);e.texStorage2D(s.TEXTURE_2D,Ft,at,xt.width,xt.height)}Ot&&e.texSubImage2D(s.TEXTURE_2D,0,0,0,_t,B,ot)}else e.texImage2D(s.TEXTURE_2D,0,at,_t,B,ot);I(R)&&R.mipmapsAutoUpdate===!0&&A(N),it.__version=X.version,R.onUpdate&&R.onUpdate(R)}O.__version=R.version}function Qe(O,R,ht){if(R.image.length!==6)return;const N=ve(O,R),U=R.source;e.bindTexture(s.TEXTURE_CUBE_MAP,O.__webglTexture,s.TEXTURE0+ht);const X=i.get(U);if(U.version!==X.__version||N===!0){e.activeTexture(s.TEXTURE0+ht);const it=xe.getPrimaries(xe.workingColorSpace),q=R.colorSpace===ds?null:xe.getPrimaries(R.colorSpace),ot=R.colorSpace===ds||it===q?s.NONE:s.BROWSER_DEFAULT_WEBGL;e.pixelStorei(s.UNPACK_FLIP_Y_WEBGL,R.flipY),e.pixelStorei(s.UNPACK_PREMULTIPLY_ALPHA_WEBGL,R.premultiplyAlpha),e.pixelStorei(s.UNPACK_ALIGNMENT,R.unpackAlignment),e.pixelStorei(s.UNPACK_COLORSPACE_CONVERSION_WEBGL,ot);const _t=R.isCompressedTexture||R.image[0].isCompressedTexture,B=R.image[0]&&R.image[0].isDataTexture,at=[];for(let Pt=0;Pt<6;Pt++)!_t&&!B?at[Pt]=b(R.image[Pt],!0,r.maxCubemapSize):at[Pt]=B?R.image[Pt].image:R.image[Pt],at[Pt]=Yt(R,at[Pt]);const et=at[0],vt=a.convert(R.format,R.colorSpace),gt=a.convert(R.type);let mt=E(R.internalFormat,vt,gt,R.normalized,R.colorSpace);const Ot=R.isVideoTexture!==!0,Ft=X.__version===void 0||N===!0,xt=U.dataReady;let kt=T(R,et);fe(s.TEXTURE_CUBE_MAP,R);let qt;if(R.isDepthTexture){if(mt=x(R.format===fs,R.type),Ft)if(Ot)e.texStorage2D(s.TEXTURE_CUBE_MAP,1,mt,et.width,et.height);else for(let Pt=0;Pt<6;Pt++)e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,mt,et.width,et.height,0,vt,gt,null)}else if(_t){Ot&&Ft&&e.texStorage2D(s.TEXTURE_CUBE_MAP,kt,mt,et.width,et.height);for(let Pt=0;Pt<6;Pt++){qt=at[Pt].mipmaps;for(let ne=0;ne<qt.length;ne++){const Lt=qt[ne];R.format!==Ai?vt!==null?Ot?xt&&e.compressedTexSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne,0,0,Lt.width,Lt.height,vt,Lt.data):e.compressedTexImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne,mt,Lt.width,Lt.height,0,Lt.data):re("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ot?xt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne,0,0,Lt.width,Lt.height,vt,gt,Lt.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne,mt,Lt.width,Lt.height,0,vt,gt,Lt.data)}}}else{if(qt=R.mipmaps,Ot&&Ft){qt.length>0&&kt++;const Pt=te(at[0]);e.texStorage2D(s.TEXTURE_CUBE_MAP,kt,mt,Pt.width,Pt.height)}for(let Pt=0;Pt<6;Pt++)if(B){Ot?xt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,0,0,at[Pt].width,at[Pt].height,vt,gt,at[Pt].data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,mt,at[Pt].width,at[Pt].height,0,vt,gt,at[Pt].data);for(let ne=0;ne<qt.length;ne++){const Tn=qt[ne].image[Pt].image;Ot?xt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne+1,0,0,Tn.width,Tn.height,vt,gt,Tn.data):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne+1,mt,Tn.width,Tn.height,0,vt,gt,Tn.data)}}else{Ot?xt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,0,0,vt,gt,at[Pt]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,0,mt,vt,gt,at[Pt]);for(let ne=0;ne<qt.length;ne++){const Lt=qt[ne];Ot?xt&&e.texSubImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne+1,0,0,vt,gt,Lt.image[Pt]):e.texImage2D(s.TEXTURE_CUBE_MAP_POSITIVE_X+Pt,ne+1,mt,vt,gt,Lt.image[Pt])}}}I(R)&&R.mipmapsAutoUpdate===!0&&A(s.TEXTURE_CUBE_MAP),X.__version=U.version,R.onUpdate&&R.onUpdate(R)}O.__version=R.version}function Re(O,R,ht,N,U,X){const it=a.convert(ht.format,ht.colorSpace),q=a.convert(ht.type),ot=E(ht.internalFormat,it,q,ht.normalized,ht.colorSpace),_t=i.get(R),B=i.get(ht);if(B.__renderTarget=R,!_t.__hasExternalTextures){const at=Math.max(1,R.width>>X),et=Math.max(1,R.height>>X);U===s.TEXTURE_3D||U===s.TEXTURE_2D_ARRAY?e.texImage3D(U,X,ot,at,et,R.depth,0,it,q,null):e.texImage2D(U,X,ot,at,et,0,it,q,null)}e.bindFramebuffer(s.FRAMEBUFFER,O),Ct(R)?h.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,N,U,B.__webglTexture,0,Ie(R)):(U===s.TEXTURE_2D||U>=s.TEXTURE_CUBE_MAP_POSITIVE_X&&U<=s.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&s.framebufferTexture2D(s.FRAMEBUFFER,N,U,B.__webglTexture,X),e.bindFramebuffer(s.FRAMEBUFFER,null)}function Ln(O,R,ht){if(s.bindRenderbuffer(s.RENDERBUFFER,O),R.depthBuffer){const N=R.depthTexture,U=N&&N.isDepthTexture?N.type:null,X=x(R.stencilBuffer,U),it=R.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;Ct(R)?h.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ie(R),X,R.width,R.height):ht?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ie(R),X,R.width,R.height):s.renderbufferStorage(s.RENDERBUFFER,X,R.width,R.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,it,s.RENDERBUFFER,O)}else{const N=R.textures;for(let U=0;U<N.length;U++){const X=N[U],it=a.convert(X.format,X.colorSpace),q=a.convert(X.type),ot=E(X.internalFormat,it,q,X.normalized,X.colorSpace);Ct(R)?h.renderbufferStorageMultisampleEXT(s.RENDERBUFFER,Ie(R),ot,R.width,R.height):ht?s.renderbufferStorageMultisample(s.RENDERBUFFER,Ie(R),ot,R.width,R.height):s.renderbufferStorage(s.RENDERBUFFER,ot,R.width,R.height)}}s.bindRenderbuffer(s.RENDERBUFFER,null)}function ze(O,R,ht){const N=R.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(s.FRAMEBUFFER,O),!(R.depthTexture&&R.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const U=i.get(R.depthTexture);U.__renderTarget=R;const X=N?R.depthTexture.image[0]:R.depthTexture.image;(!U.__webglTexture||X.width!==R.width||X.height!==R.height)&&(X.width=R.width,X.height=R.height,R.depthTexture.needsUpdate=!0),N?Rt(R.depthTexture,0):Mt(R.depthTexture,0);const it=U.__webglTexture,q=Ie(R),ot=N?s.TEXTURE_CUBE_MAP_POSITIVE_X+ht:s.TEXTURE_2D,_t=R.depthTexture.format===fs?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;if(R.depthTexture.format===vs)Ct(R)?h.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,_t,ot,it,0,q):s.framebufferTexture2D(s.FRAMEBUFFER,_t,ot,it,0);else if(R.depthTexture.format===fs)Ct(R)?h.framebufferTexture2DMultisampleEXT(s.FRAMEBUFFER,_t,ot,it,0,q):s.framebufferTexture2D(s.FRAMEBUFFER,_t,ot,it,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function je(O){const R=i.get(O),ht=O.isWebGLCubeRenderTarget===!0;if(R.__boundDepthTexture!==O.depthTexture){const N=O.depthTexture;if(R.__depthDisposeCallback&&R.__depthDisposeCallback(),N){const U=()=>{delete R.__boundDepthTexture,delete R.__depthDisposeCallback,N.removeEventListener("dispose",U)};N.addEventListener("dispose",U),R.__depthDisposeCallback=U}R.__boundDepthTexture=N}if(O.depthTexture&&!R.__autoAllocateDepthBuffer)if(ht)for(let N=0;N<6;N++)ze(R.__webglFramebuffer[N],O,N);else O.texture.mipmaps.length>0?ze(R.__webglFramebuffer[0],O,0):ze(R.__webglFramebuffer,O,0);else if(ht){R.__webglDepthbuffer=[];for(let N=0;N<6;N++)if(e.bindFramebuffer(s.FRAMEBUFFER,R.__webglFramebuffer[N]),R.__webglDepthbuffer[N]===void 0)R.__webglDepthbuffer[N]=s.createRenderbuffer(),Ln(R.__webglDepthbuffer[N],O,!1);else{const U=O.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,X=R.__webglDepthbuffer[N];s.bindRenderbuffer(s.RENDERBUFFER,X),s.framebufferRenderbuffer(s.FRAMEBUFFER,U,s.RENDERBUFFER,X)}}else if(O.texture.mipmaps.length>0?e.bindFramebuffer(s.FRAMEBUFFER,R.__webglFramebuffer[0]):e.bindFramebuffer(s.FRAMEBUFFER,R.__webglFramebuffer),R.__webglDepthbuffer===void 0)R.__webglDepthbuffer=s.createRenderbuffer(),Ln(R.__webglDepthbuffer,O,!1);else{const U=O.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,X=R.__webglDepthbuffer;s.bindRenderbuffer(s.RENDERBUFFER,X),s.framebufferRenderbuffer(s.FRAMEBUFFER,U,s.RENDERBUFFER,X)}e.bindFramebuffer(s.FRAMEBUFFER,null)}function fn(O,R,ht){const N=i.get(O);R!==void 0&&Re(N.__webglFramebuffer,O,O.texture,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,0),ht!==void 0&&je(O)}function Sn(O){const R=O.texture,ht=i.get(O),N=i.get(R);O.addEventListener("dispose",G),H(O);const U=O.textures,X=O.isWebGLCubeRenderTarget===!0,it=U.length>1;if(it||(N.__webglTexture===void 0&&(N.__webglTexture=s.createTexture()),N.__version=R.version,l.memory.textures++),X){ht.__webglFramebuffer=[];for(let q=0;q<6;q++)if(R.mipmaps.length>0){ht.__webglFramebuffer[q]=[];for(let ot=0;ot<R.mipmaps.length;ot++)ht.__webglFramebuffer[q][ot]=s.createFramebuffer()}else ht.__webglFramebuffer[q]=s.createFramebuffer()}else{if(R.mipmaps.length>0){ht.__webglFramebuffer=[];for(let q=0;q<R.mipmaps.length;q++)ht.__webglFramebuffer[q]=s.createFramebuffer()}else ht.__webglFramebuffer=s.createFramebuffer();if(it)for(let q=0,ot=U.length;q<ot;q++){const _t=i.get(U[q]);_t.__webglTexture===void 0&&(_t.__webglTexture=s.createTexture(),l.memory.textures++)}if(O.samples>0&&Ct(O)===!1){ht.__webglMultisampledFramebuffer=s.createFramebuffer(),ht.__webglColorRenderbuffer=[],e.bindFramebuffer(s.FRAMEBUFFER,ht.__webglMultisampledFramebuffer);for(let q=0;q<U.length;q++){const ot=U[q];ht.__webglColorRenderbuffer[q]=s.createRenderbuffer(),s.bindRenderbuffer(s.RENDERBUFFER,ht.__webglColorRenderbuffer[q]);const _t=a.convert(ot.format,ot.colorSpace),B=a.convert(ot.type),at=E(ot.internalFormat,_t,B,ot.normalized,ot.colorSpace,O.isXRRenderTarget===!0),et=Ie(O);s.renderbufferStorageMultisample(s.RENDERBUFFER,et,at,O.width,O.height),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+q,s.RENDERBUFFER,ht.__webglColorRenderbuffer[q])}s.bindRenderbuffer(s.RENDERBUFFER,null),O.depthBuffer&&(ht.__webglDepthRenderbuffer=s.createRenderbuffer(),Ln(ht.__webglDepthRenderbuffer,O,!0)),e.bindFramebuffer(s.FRAMEBUFFER,null)}}if(X){e.bindTexture(s.TEXTURE_CUBE_MAP,N.__webglTexture),fe(s.TEXTURE_CUBE_MAP,R);for(let q=0;q<6;q++)if(R.mipmaps.length>0)for(let ot=0;ot<R.mipmaps.length;ot++)Re(ht.__webglFramebuffer[q][ot],O,R,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+q,ot);else Re(ht.__webglFramebuffer[q],O,R,s.COLOR_ATTACHMENT0,s.TEXTURE_CUBE_MAP_POSITIVE_X+q,0);I(R)?A(s.TEXTURE_CUBE_MAP):R.mipmaps.length>0&&s.texParameteri(s.TEXTURE_CUBE_MAP,s.TEXTURE_MAX_LEVEL,R.mipmaps.length-1),e.unbindTexture()}else if(it){for(let q=0,ot=U.length;q<ot;q++){const _t=U[q],B=i.get(_t);let at=s.TEXTURE_2D;(O.isWebGL3DRenderTarget||O.isWebGLArrayRenderTarget)&&(at=O.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(at,B.__webglTexture),fe(at,_t),Re(ht.__webglFramebuffer,O,_t,s.COLOR_ATTACHMENT0+q,at,0),I(_t)&&A(at)}e.unbindTexture()}else{let q=s.TEXTURE_2D;if((O.isWebGL3DRenderTarget||O.isWebGLArrayRenderTarget)&&(q=O.isWebGL3DRenderTarget?s.TEXTURE_3D:s.TEXTURE_2D_ARRAY),e.bindTexture(q,N.__webglTexture),fe(q,R),R.mipmaps.length>0)for(let ot=0;ot<R.mipmaps.length;ot++)Re(ht.__webglFramebuffer[ot],O,R,s.COLOR_ATTACHMENT0,q,ot);else Re(ht.__webglFramebuffer,O,R,s.COLOR_ATTACHMENT0,q,0);I(R)?A(q):R.mipmaps.length>0&&s.texParameteri(q,s.TEXTURE_MAX_LEVEL,R.mipmaps.length-1),e.unbindTexture()}O.depthBuffer&&je(O)}function K(O){const R=O.textures;for(let ht=0,N=R.length;ht<N;ht++){const U=R[ht];if(I(U)&&U.mipmapsAutoUpdate===!0){const X=D(O),it=i.get(U).__webglTexture;e.bindTexture(X,it),A(X),e.unbindTexture()}}}const tn=[];function Pe(O){if(O.samples>0){if(Ct(O)===!1){const R=O.textures,ht=O.width,N=O.height;let U=s.COLOR_BUFFER_BIT;const X=O.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT,it=i.get(O),q=R.length>1;if(q)for(let _t=0;_t<R.length;_t++)e.bindFramebuffer(s.FRAMEBUFFER,it.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+_t,s.RENDERBUFFER,null),e.bindFramebuffer(s.FRAMEBUFFER,it.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+_t,s.TEXTURE_2D,null,0);e.bindFramebuffer(s.READ_FRAMEBUFFER,it.__webglMultisampledFramebuffer),O.texture.mipmaps.length>0?e.bindFramebuffer(s.DRAW_FRAMEBUFFER,it.__webglFramebuffer[0]):e.bindFramebuffer(s.DRAW_FRAMEBUFFER,it.__webglFramebuffer);for(let _t=0;_t<R.length;_t++){if(O.resolveDepthBuffer&&(O.depthBuffer&&(U|=s.DEPTH_BUFFER_BIT),O.stencilBuffer&&O.resolveStencilBuffer&&(U|=s.STENCIL_BUFFER_BIT)),q){s.framebufferRenderbuffer(s.READ_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.RENDERBUFFER,it.__webglColorRenderbuffer[_t]);const B=i.get(R[_t]).__webglTexture;s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0,s.TEXTURE_2D,B,0)}s.blitFramebuffer(0,0,ht,N,0,0,ht,N,U,s.NEAREST),u===!0&&(tn.length=0,tn.push(s.COLOR_ATTACHMENT0+_t),O.depthBuffer&&O.storeMultisampledDepthBuffer===!1&&tn.push(X),s.invalidateFramebuffer(s.READ_FRAMEBUFFER,tn))}if(e.bindFramebuffer(s.READ_FRAMEBUFFER,null),e.bindFramebuffer(s.DRAW_FRAMEBUFFER,null),q)for(let _t=0;_t<R.length;_t++){e.bindFramebuffer(s.FRAMEBUFFER,it.__webglMultisampledFramebuffer),s.framebufferRenderbuffer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+_t,s.RENDERBUFFER,it.__webglColorRenderbuffer[_t]);const B=i.get(R[_t]).__webglTexture;e.bindFramebuffer(s.FRAMEBUFFER,it.__webglFramebuffer),s.framebufferTexture2D(s.DRAW_FRAMEBUFFER,s.COLOR_ATTACHMENT0+_t,s.TEXTURE_2D,B,0)}e.bindFramebuffer(s.DRAW_FRAMEBUFFER,it.__webglMultisampledFramebuffer)}else if(O.depthBuffer&&O.storeMultisampledDepthBuffer===!1&&u){const R=O.stencilBuffer?s.DEPTH_STENCIL_ATTACHMENT:s.DEPTH_ATTACHMENT;s.invalidateFramebuffer(s.DRAW_FRAMEBUFFER,[R])}}}function Ie(O){return Math.min(r.maxSamples,O.samples)}function Ct(O){const R=i.get(O);return O.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&R.__useRenderToTexture!==!1}function ke(O){const R=l.render.frame;m.get(O)!==R&&(m.set(O,R),O.update())}function Yt(O,R){const ht=O.colorSpace,N=O.format,U=O.type;return O.isCompressedTexture===!0||O.isVideoTexture===!0||ht!==ho&&ht!==ds&&(xe.getTransfer(ht)===De?(N!==Ai||U!==Yn)&&re("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Te("WebGLTextures: Unsupported texture color space:",ht)),R}function te(O){return typeof HTMLImageElement<"u"&&O instanceof HTMLImageElement?(d.width=O.naturalWidth||O.width,d.height=O.naturalHeight||O.height):typeof VideoFrame<"u"&&O instanceof VideoFrame?(d.width=O.displayWidth,d.height=O.displayHeight):(d.width=O.width,d.height=O.height),d}this.allocateTextureUnit=Dt,this.resetTextureUnits=Y,this.getTextureUnits=lt,this.setTextureUnits=St,this.setTexture2D=Mt,this.setTexture2DArray=yt,this.setTexture3D=Wt,this.setTextureCube=Rt,this.rebindTextures=fn,this.setupRenderTarget=Sn,this.updateRenderTargetMipmap=K,this.updateMultisampleRenderTarget=Pe,this.setupDepthRenderbuffer=je,this.setupFrameBufferTexture=Re,this.useMultisampledRTT=Ct,this.dispose=j}function TM(s,t){function e(i,r=ds){let a;const l=xe.getTransfer(r);if(i===Yn)return s.UNSIGNED_BYTE;if(i===Qc)return s.UNSIGNED_SHORT_4_4_4_4;if(i===jc)return s.UNSIGNED_SHORT_5_5_5_1;if(i===rf)return s.UNSIGNED_INT_5_9_9_9_REV;if(i===of)return s.UNSIGNED_INT_10F_11F_11F_REV;if(i===nf)return s.BYTE;if(i===sf)return s.SHORT;if(i===co)return s.UNSIGNED_SHORT;if(i===Jc)return s.INT;if(i===Ci)return s.UNSIGNED_INT;if(i===pi)return s.FLOAT;if(i===Li)return s.HALF_FLOAT;if(i===af)return s.ALPHA;if(i===lf)return s.RGB;if(i===Ai)return s.RGBA;if(i===vs)return s.DEPTH_COMPONENT;if(i===fs)return s.DEPTH_STENCIL;if(i===th)return s.RED;if(i===eh)return s.RED_INTEGER;if(i===Os)return s.RG;if(i===nh)return s.RG_INTEGER;if(i===ih)return s.RGBA_INTEGER;if(i===ga||i===va||i===xa||i===Ma)if(l===De)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===ga)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===va)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===xa)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ma)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===ga)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===va)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===xa)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ma)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===sc||i===rc||i===oc||i===ac)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===sc)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===rc)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===oc)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ac)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===lc||i===cc||i===hc||i===uc||i===dc||i===Ta||i===fc)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===lc||i===cc)return l===De?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===hc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===uc)return a.COMPRESSED_R11_EAC;if(i===dc)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Ta)return a.COMPRESSED_RG11_EAC;if(i===fc)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===pc||i===mc||i===_c||i===gc||i===vc||i===xc||i===Mc||i===yc||i===Sc||i===wc||i===bc||i===Ec||i===Tc||i===Ac)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===pc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===mc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===_c)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===gc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===vc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===xc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Mc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===yc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Sc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===wc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===bc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Ec)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Tc)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Ac)return l===De?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Rc||i===Pc||i===Cc)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===Rc)return l===De?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Pc)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Cc)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Lc||i===Ic||i===Aa||i===Dc)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===Lc)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Ic)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Aa)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Dc)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Sr?s.UNSIGNED_INT_24_8:s[i]!==void 0?s[i]:null}return{convert:e}}const AM=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,RM=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class PM{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const i=new Ef(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,i=new Ii({vertexShader:AM,fragmentShader:RM,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new pe(new ii(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class CM extends Hs{constructor(t,e){super();const i=this;let r=null,a=1,l=null,h="local-floor",u=1,d=null,m=null,_=null,p=null,g=null,y=null;const w=typeof XRWebGLBinding<"u",M=new PM,v={},b=e.getContextAttributes();let I=null,A=null;const D=[],E=[],x=new le;let T=null,H=null;const F=new ui;F.viewport=new Ze;const k=new ui;k.viewport=new Ze;const G=[F,k],W=new H_;let z=null,j=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let Mt=D[J];return Mt===void 0&&(Mt=new wl,D[J]=Mt),Mt.getTargetRaySpace()},this.getControllerGrip=function(J){let Mt=D[J];return Mt===void 0&&(Mt=new wl,D[J]=Mt),Mt.getGripSpace()},this.getHand=function(J){let Mt=D[J];return Mt===void 0&&(Mt=new wl,D[J]=Mt),Mt.getHandSpace()};function rt(J){const Mt=E.indexOf(J.inputSource);if(Mt===-1)return;const yt=D[Mt];yt!==void 0&&(yt.update(J.inputSource,J.frame,d||l),yt.dispatchEvent({type:J.type,data:J.inputSource}))}function $(){r.removeEventListener("select",rt),r.removeEventListener("selectstart",rt),r.removeEventListener("selectend",rt),r.removeEventListener("squeeze",rt),r.removeEventListener("squeezestart",rt),r.removeEventListener("squeezeend",rt),r.removeEventListener("end",$),r.removeEventListener("inputsourceschange",st);for(let J=0;J<D.length;J++){const Mt=E[J];Mt!==null&&(E[J]=null,D[J].disconnect(Mt))}z=null,j=null,M.reset();for(const J in v)delete v[J];if(t.setRenderTarget(I),g=null,p=null,_=null,r=null,A=null,Dt.stop(),i.isPresenting=!1,t.setPixelRatio(T),t.setSize(x.width,x.height,!1),H!==null){const J=H.camera;J.fov=H.fov,J.zoom=H.zoom,J.updateProjectionMatrix(),H=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){a=J,i.isPresenting===!0&&re("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){h=J,i.isPresenting===!0&&re("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return d||l},this.setReferenceSpace=function(J){d=J},this.getBaseLayer=function(){return p!==null?p:g},this.getBinding=function(){return _===null&&w&&(_=new XRWebGLBinding(r,e)),_},this.getFrame=function(){return y},this.getSession=function(){return r},this.setSession=async function(J){if(r=J,r!==null){if(I=t.getRenderTarget(),r.addEventListener("select",rt),r.addEventListener("selectstart",rt),r.addEventListener("selectend",rt),r.addEventListener("squeeze",rt),r.addEventListener("squeezestart",rt),r.addEventListener("squeezeend",rt),r.addEventListener("end",$),r.addEventListener("inputsourceschange",st),b.xrCompatible!==!0&&await e.makeXRCompatible(),T=t.getPixelRatio(),t.getSize(x),w&&"createProjectionLayer"in XRWebGLBinding.prototype){let yt=null,Wt=null,Rt=null;b.depth&&(Rt=b.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,yt=b.stencil?fs:vs,Wt=b.stencil?Sr:Ci);const jt={colorFormat:e.RGBA8,depthFormat:Rt,scaleFactor:a};_=this.getBinding(),p=_.createProjectionLayer(jt),r.updateRenderState({layers:[p]}),t.setPixelRatio(1),t.setSize(p.textureWidth,p.textureHeight,!1),A=new vi(p.textureWidth,p.textureHeight,{format:Ai,type:Yn,depthTexture:new wr(p.textureWidth,p.textureHeight,Wt,void 0,void 0,void 0,void 0,void 0,void 0,yt),stencilBuffer:b.stencil,colorSpace:t.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}else{const yt={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:a};g=new XRWebGLLayer(r,e,yt),r.updateRenderState({baseLayer:g}),t.setPixelRatio(1),t.setSize(g.framebufferWidth,g.framebufferHeight,!1),A=new vi(g.framebufferWidth,g.framebufferHeight,{format:Ai,type:Yn,colorSpace:t.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1,storeMultisampledDepthBuffer:g.ignoreDepthValues===!1,storeMultisampledStencilBuffer:g.ignoreDepthValues===!1})}A.isXRRenderTarget=!0,this.setFoveation(u),d=null,l=await r.requestReferenceSpace(h),Dt.setContext(r),Dt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return M.getDepthTexture()};function st(J){for(let Mt=0;Mt<J.removed.length;Mt++){const yt=J.removed[Mt],Wt=E.indexOf(yt);Wt>=0&&(E[Wt]=null,D[Wt].disconnect(yt))}for(let Mt=0;Mt<J.added.length;Mt++){const yt=J.added[Mt];let Wt=E.indexOf(yt);if(Wt===-1){for(let jt=0;jt<D.length;jt++)if(jt>=E.length){E.push(yt),Wt=jt;break}else if(E[jt]===null){E[jt]=yt,Wt=jt;break}if(Wt===-1)break}const Rt=D[Wt];Rt&&Rt.connect(yt)}}function tt(J,Mt){Mt===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(Mt.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(r===null)return;let Mt=J.near,yt=J.far;M.texture!==null&&(M.depthNear>0&&(Mt=M.depthNear),M.depthFar>0&&(yt=M.depthFar)),W.near=k.near=F.near=Mt,W.far=k.far=F.far=yt,(z!==W.near||j!==W.far)&&(r.updateRenderState({depthNear:W.near,depthFar:W.far}),z=W.near,j=W.far),W.layers.mask=J.layers.mask|6,F.layers.mask=W.layers.mask&-5,k.layers.mask=W.layers.mask&-3;const Wt=J.parent,Rt=W.cameras;tt(W,Wt);for(let jt=0;jt<Rt.length;jt++)tt(Rt[jt],Wt);W.projectionMatrix.copy(F.projectionMatrix),W.projectionMatrixInverse.copy(F.projectionMatrixInverse),H===null&&J.isPerspectiveCamera&&(H={camera:J,fov:J.fov,zoom:J.zoom}),Y(J,W,Wt)};function Y(J,Mt,yt){yt===null?J.matrix.copy(Mt.matrixWorld):(J.matrix.copy(yt.matrixWorld),J.matrix.invert(),J.matrix.multiply(Mt.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(Mt.projectionMatrix),J.projectionMatrixInverse.copy(Mt.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=po*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return W},this.getFoveation=function(){if(!(p===null&&g===null))return u},this.setFoveation=function(J){u=J,p!==null&&(p.fixedFoveation=J),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=J)},this.hasDepthSensing=function(){return M.texture!==null},this.getDepthSensingMesh=function(){return M.getMesh(W)},this.getCameraTexture=function(J){return v[J]};let lt=null;function St(J,Mt){if(m=Mt.getViewerPose(d||l),y=Mt,m!==null){const yt=m.views;g!==null&&(t.setRenderTargetFramebuffer(A,g.framebuffer),t.setRenderTarget(A));let Wt=!1;yt.length!==W.cameras.length&&(W.cameras.length=0,Wt=!0);for(let Jt=0;Jt<yt.length;Jt++){const fe=yt[Jt];let ve=null;if(g!==null)ve=g.getViewport(fe);else{const We=_.getViewSubImage(p,fe);ve=We.viewport,Jt===0&&(t.setRenderTargetTextures(A,We.colorTexture,We.depthStencilTexture),t.setRenderTarget(A))}let ce=G[Jt];ce===void 0&&(ce=new ui,ce.layers.enable(Jt),ce.viewport=new Ze,G[Jt]=ce),ce.matrix.fromArray(fe.transform.matrix),ce.matrix.decompose(ce.position,ce.quaternion,ce.scale),ce.projectionMatrix.fromArray(fe.projectionMatrix),ce.projectionMatrixInverse.copy(ce.projectionMatrix).invert(),ce.viewport.set(ve.x,ve.y,ve.width,ve.height),Jt===0&&(W.matrix.copy(ce.matrix),W.matrix.decompose(W.position,W.quaternion,W.scale)),Wt===!0&&W.cameras.push(ce)}const Rt=r.enabledFeatures;if(Rt&&Rt.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&w){_=i.getBinding();const Jt=_.getDepthInformation(yt[0]);Jt&&Jt.isValid&&Jt.texture&&M.init(Jt,r.renderState)}if(Rt&&Rt.includes("camera-access")&&w){t.state.unbindTexture(),_=i.getBinding();for(let Jt=0;Jt<yt.length;Jt++){const fe=yt[Jt].camera;if(fe){let ve=v[fe];ve||(ve=new Ef,v[fe]=ve);const ce=_.getCameraImage(fe);ve.sourceTexture=ce}}}}for(let yt=0;yt<D.length;yt++){const Wt=E[yt],Rt=D[yt];Wt!==null&&Rt!==void 0&&Rt.update(Wt,Mt,d||l)}lt&&lt(J,Mt),Mt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Mt}),y=null}const Dt=new Rf;Dt.setAnimationLoop(St),this.setAnimationLoop=function(J){lt=J},this.dispose=function(){}}}const LM=new Ae,zf=new oe;zf.set(-1,0,0,0,1,0,0,0,1);function IM(s,t){function e(M,v){M.matrixAutoUpdate===!0&&M.updateMatrix(),v.value.copy(M.matrix)}function i(M,v){v.color.getRGB(M.fogColor.value,Tf(s)),v.isFog?(M.fogNear.value=v.near,M.fogFar.value=v.far):v.isFogExp2&&(M.fogDensity.value=v.density)}function r(M,v,b,I,A){v.isNodeMaterial?v.uniformsNeedUpdate=!1:v.isMeshBasicMaterial?a(M,v):v.isMeshLambertMaterial?(a(M,v),v.envMap&&(M.envMapIntensity.value=v.envMapIntensity)):v.isMeshToonMaterial?(a(M,v),_(M,v)):v.isMeshPhongMaterial?(a(M,v),m(M,v),v.envMap&&(M.envMapIntensity.value=v.envMapIntensity)):v.isMeshStandardMaterial?(a(M,v),p(M,v),v.isMeshPhysicalMaterial&&g(M,v,A)):v.isMeshMatcapMaterial?(a(M,v),y(M,v)):v.isMeshDepthMaterial?a(M,v):v.isMeshDistanceMaterial?(a(M,v),w(M,v)):v.isMeshNormalMaterial?a(M,v):v.isLineBasicMaterial?(l(M,v),v.isLineDashedMaterial&&h(M,v)):v.isPointsMaterial?u(M,v,b,I):v.isSpriteMaterial?d(M,v):v.isShadowMaterial?(M.color.value.copy(v.color),M.opacity.value=v.opacity):v.isShaderMaterial&&(v.uniformsNeedUpdate=!1)}function a(M,v){M.opacity.value=v.opacity,v.color&&M.diffuse.value.copy(v.color),v.emissive&&M.emissive.value.copy(v.emissive).multiplyScalar(v.emissiveIntensity),v.map&&(M.map.value=v.map,e(v.map,M.mapTransform)),v.alphaMap&&(M.alphaMap.value=v.alphaMap,e(v.alphaMap,M.alphaMapTransform)),v.bumpMap&&(M.bumpMap.value=v.bumpMap,e(v.bumpMap,M.bumpMapTransform),M.bumpScale.value=v.bumpScale,v.side===zn&&(M.bumpScale.value*=-1)),v.normalMap&&(M.normalMap.value=v.normalMap,e(v.normalMap,M.normalMapTransform),M.normalScale.value.copy(v.normalScale),v.side===zn&&M.normalScale.value.negate()),v.displacementMap&&(M.displacementMap.value=v.displacementMap,e(v.displacementMap,M.displacementMapTransform),M.displacementScale.value=v.displacementScale,M.displacementBias.value=v.displacementBias),v.emissiveMap&&(M.emissiveMap.value=v.emissiveMap,e(v.emissiveMap,M.emissiveMapTransform)),v.specularMap&&(M.specularMap.value=v.specularMap,e(v.specularMap,M.specularMapTransform)),v.alphaTest>0&&(M.alphaTest.value=v.alphaTest);const b=t.get(v),I=b.envMap,A=b.envMapRotation;I&&(M.envMap.value=I,M.envMapRotation.value.setFromMatrix4(LM.makeRotationFromEuler(A)).transpose(),I.isCubeTexture&&I.isRenderTargetTexture===!1&&M.envMapRotation.value.premultiply(zf),M.reflectivity.value=v.reflectivity,M.ior.value=v.ior,M.refractionRatio.value=v.refractionRatio),v.lightMap&&(M.lightMap.value=v.lightMap,M.lightMapIntensity.value=v.lightMapIntensity,e(v.lightMap,M.lightMapTransform)),v.aoMap&&(M.aoMap.value=v.aoMap,M.aoMapIntensity.value=v.aoMapIntensity,e(v.aoMap,M.aoMapTransform))}function l(M,v){M.diffuse.value.copy(v.color),M.opacity.value=v.opacity,v.map&&(M.map.value=v.map,e(v.map,M.mapTransform))}function h(M,v){M.dashSize.value=v.dashSize,M.totalSize.value=v.dashSize+v.gapSize,M.scale.value=v.scale}function u(M,v,b,I){M.diffuse.value.copy(v.color),M.opacity.value=v.opacity,M.size.value=v.size*b,M.scale.value=I*.5,v.map&&(M.map.value=v.map,e(v.map,M.uvTransform)),v.alphaMap&&(M.alphaMap.value=v.alphaMap,e(v.alphaMap,M.alphaMapTransform)),v.alphaTest>0&&(M.alphaTest.value=v.alphaTest)}function d(M,v){M.diffuse.value.copy(v.color),M.opacity.value=v.opacity,M.rotation.value=v.rotation,v.map&&(M.map.value=v.map,e(v.map,M.mapTransform)),v.alphaMap&&(M.alphaMap.value=v.alphaMap,e(v.alphaMap,M.alphaMapTransform)),v.alphaTest>0&&(M.alphaTest.value=v.alphaTest)}function m(M,v){M.specular.value.copy(v.specular),M.shininess.value=Math.max(v.shininess,1e-4)}function _(M,v){v.gradientMap&&(M.gradientMap.value=v.gradientMap)}function p(M,v){M.metalness.value=v.metalness,v.metalnessMap&&(M.metalnessMap.value=v.metalnessMap,e(v.metalnessMap,M.metalnessMapTransform)),M.roughness.value=v.roughness,v.roughnessMap&&(M.roughnessMap.value=v.roughnessMap,e(v.roughnessMap,M.roughnessMapTransform)),v.envMap&&(M.envMapIntensity.value=v.envMapIntensity)}function g(M,v,b){M.ior.value=v.ior,v.diffuseRoughness>0&&(M.diffuseRoughness.value=v.diffuseRoughness,v.diffuseRoughnessMap&&(M.diffuseRoughnessMap.value=v.diffuseRoughnessMap,e(v.diffuseRoughnessMap,M.diffuseRoughnessMapTransform))),v.sheen>0&&(M.sheenColor.value.copy(v.sheenColor).multiplyScalar(v.sheen),M.sheenRoughness.value=v.sheenRoughness,v.sheenColorMap&&(M.sheenColorMap.value=v.sheenColorMap,e(v.sheenColorMap,M.sheenColorMapTransform)),v.sheenRoughnessMap&&(M.sheenRoughnessMap.value=v.sheenRoughnessMap,e(v.sheenRoughnessMap,M.sheenRoughnessMapTransform))),v.clearcoat>0&&(M.clearcoat.value=v.clearcoat,M.clearcoatRoughness.value=v.clearcoatRoughness,v.clearcoatMap&&(M.clearcoatMap.value=v.clearcoatMap,e(v.clearcoatMap,M.clearcoatMapTransform)),v.clearcoatRoughnessMap&&(M.clearcoatRoughnessMap.value=v.clearcoatRoughnessMap,e(v.clearcoatRoughnessMap,M.clearcoatRoughnessMapTransform)),v.clearcoatNormalMap&&(M.clearcoatNormalMap.value=v.clearcoatNormalMap,e(v.clearcoatNormalMap,M.clearcoatNormalMapTransform),M.clearcoatNormalScale.value.copy(v.clearcoatNormalScale),v.side===zn&&M.clearcoatNormalScale.value.negate())),v.dispersion>0&&(M.dispersion.value=v.dispersion),v.retroreflectivity>0&&(M.retroreflectivity.value=v.retroreflectivity),v.iridescence>0&&(M.iridescence.value=v.iridescence,M.iridescenceIOR.value=v.iridescenceIOR,M.iridescenceThicknessMinimum.value=v.iridescenceThicknessMinimum,M.iridescenceThicknessMaximum.value=v.iridescenceThicknessMaximum,v.iridescenceMap&&(M.iridescenceMap.value=v.iridescenceMap,e(v.iridescenceMap,M.iridescenceMapTransform)),v.iridescenceThicknessMap&&(M.iridescenceThicknessMap.value=v.iridescenceThicknessMap,e(v.iridescenceThicknessMap,M.iridescenceThicknessMapTransform))),v.transmission>0&&(M.transmission.value=v.transmission,M.transmissionSamplerMap.value=b.texture,M.transmissionSamplerSize.value.set(b.width,b.height),v.transmissionMap&&(M.transmissionMap.value=v.transmissionMap,e(v.transmissionMap,M.transmissionMapTransform)),M.thickness.value=v.thickness,v.thicknessMap&&(M.thicknessMap.value=v.thicknessMap,e(v.thicknessMap,M.thicknessMapTransform)),M.attenuationDistance.value=v.attenuationDistance,M.attenuationColor.value.copy(v.attenuationColor)),v.anisotropy>0&&(M.anisotropyVector.value.set(v.anisotropy*Math.cos(v.anisotropyRotation),v.anisotropy*Math.sin(v.anisotropyRotation)),v.anisotropyMap&&(M.anisotropyMap.value=v.anisotropyMap,e(v.anisotropyMap,M.anisotropyMapTransform))),M.specularIntensity.value=v.specularIntensity,M.specularColor.value.copy(v.specularColor),v.specularColorMap&&(M.specularColorMap.value=v.specularColorMap,e(v.specularColorMap,M.specularColorMapTransform)),v.specularIntensityMap&&(M.specularIntensityMap.value=v.specularIntensityMap,e(v.specularIntensityMap,M.specularIntensityMapTransform))}function y(M,v){v.matcap&&(M.matcap.value=v.matcap)}function w(M,v){const b=t.get(v).light;M.referencePosition.value.setFromMatrixPosition(b.matrixWorld),M.nearDistance.value=b.shadow.camera.near,M.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function DM(s,t,e,i){let r={},a={};function l(b,I){const A=I.program;i.uniformBlockBinding(b,A,r[b.id])}function h(b,I){let A=r[b.id];A===void 0&&(y(b),A=u(b),r[b.id]=A,b.addEventListener("dispose",M));const D=I.program;i.updateUBOMapping(b,D);const E=t.render.frame;a[b.id]!==E&&(d(b),a[b.id]=E)}function u(b){const I=s.createBuffer(),A=b.__size,D=b.usage;return s.bindBuffer(s.UNIFORM_BUFFER,I),s.bufferData(s.UNIFORM_BUFFER,A,D),s.bindBuffer(s.UNIFORM_BUFFER,null),I}function d(b){const I=r[b.id],A=b.uniforms,D=b.__cache;s.bindBuffer(s.UNIFORM_BUFFER,I);for(let E=0,x=A.length;E<x;E++){const T=A[E];if(Array.isArray(T))for(let H=0,F=T.length;H<F;H++)m(T[H],E,H,D);else m(T,E,0,D)}s.bindBuffer(s.UNIFORM_BUFFER,null)}function m(b,I,A,D){if(p(b,I,A,D)===!0){const E=b.__offset,x=b.value;if(Array.isArray(x)){let T=0;for(let H=0;H<x.length;H++){const F=x[H],k=w(F,!0);_(F,b.__data,T),T+=k.storage/Float32Array.BYTES_PER_ELEMENT}}else _(x,b.__data,0);s.bufferSubData(s.UNIFORM_BUFFER,E,b.__data)}}function _(b,I,A){typeof b=="number"||typeof b=="boolean"?I[A]=b:b.isMatrix3?(I[A]=b.elements[0],I[A+1]=b.elements[1],I[A+2]=b.elements[2],I[A+3]=0,I[A+4]=b.elements[3],I[A+5]=b.elements[4],I[A+6]=b.elements[5],I[A+7]=0,I[A+8]=b.elements[6],I[A+9]=b.elements[7],I[A+10]=b.elements[8],I[A+11]=0):ArrayBuffer.isView(b)?I.set(b.subarray(0,I.length-A),A):b.toArray(I,A)}function p(b,I,A,D){const E=b.value,x=I+"_"+A;if(Array.isArray(E)){D[x]===void 0&&(D[x]=[]);const T=D[x];let H=!1;for(let F=0;F<E.length;F++)g(E[F],T,F)===!0&&(H=!0);return H}return g(E,D,x)}function g(b,I,A){if(I[A]===void 0)return typeof b=="number"||typeof b=="boolean"?I[A]=b:ArrayBuffer.isView(b)?I[A]=b.slice():I[A]=b.clone(),!0;{const D=I[A];if(typeof b=="number"||typeof b=="boolean"){if(D!==b)return I[A]=b,!0}else{if(ArrayBuffer.isView(b))return!0;if(D.equals(b)===!1)return D.copy(b),!0}}return!1}function y(b){const I=b.uniforms;let A=0;const D=16;for(let x=0,T=I.length;x<T;x++){const H=Array.isArray(I[x])?I[x]:[I[x]];for(let F=0,k=H.length;F<k;F++){const G=H[F],W=Array.isArray(G.value)?G.value:[G.value],z=Array.isArray(I[x])||Array.isArray(G.value);let j=A;for(let $=0,st=W.length;$<st;$++){const tt=W[$],Y=w(tt,z),lt=A%D,St=lt%Y.boundary,Dt=lt+St;A+=St,Dt!==0&&D-Dt<Y.storage&&(A+=D-Dt),$===0&&(j=A),A+=Y.storage}const rt=G.type==="int"?Int32Array:G.type==="uint"?Uint32Array:Float32Array;G.__data=new rt((A-j)/Float32Array.BYTES_PER_ELEMENT),G.__offset=j}}const E=A%D;return E>0&&(A+=D-E),b.__size=A,b.__cache={},this}function w(b,I){const A={boundary:0,storage:0};return typeof b=="number"||typeof b=="boolean"?(A.boundary=4,A.storage=4):b.isVector2?(A.boundary=8,A.storage=8):b.isVector3||b.isColor?(A.boundary=16,A.storage=12):b.isVector4?(A.boundary=16,A.storage=16):b.isMatrix3?(A.boundary=16,A.storage=48):b.isMatrix4?(A.boundary=16,A.storage=64):b.isTexture?re("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(b)?(A.boundary=16,A.storage=b.byteLength):re("WebGLRenderer: Unsupported uniform value type.",b),I===!0&&(A.boundary=16,A.storage=Math.ceil(A.storage/16)*16),A}function M(b){const I=b.target;I.removeEventListener("dispose",M),s.deleteBuffer(r[I.id]),delete r[I.id],delete a[I.id]}function v(){for(const b in r)s.deleteBuffer(r[b]);r={},a={}}return{bind:l,update:h,dispose:v}}const NM=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let bi=null;function FM(){return bi===null&&(bi=new yf(NM,16,16,Os,Li),bi.name="DFG_LUT",bi.minFilter=On,bi.magFilter=On,bi.wrapS=Yi,bi.wrapT=Yi,bi.generateMipmaps=!1,bi.needsUpdate=!0),bi}class UM{constructor(t={}){const{canvas:e=zm(),context:i=null,depth:r=!0,stencil:a=!1,alpha:l=!1,antialias:h=!1,premultipliedAlpha:u=!0,preserveDrawingBuffer:d=!1,powerPreference:m="default",failIfMajorPerformanceCaveat:_=!1,reversedDepthBuffer:p=!1,outputBufferType:g=Yn}=t;this.isWebGLRenderer=!0;let y;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");y=i.getContextAttributes().alpha}else y=l;const w=g,M=new Set([ih,nh,eh]),v=new Set([Yn,Ci,co,Sr,Qc,jc]),b=new Uint32Array(4),I=new Int32Array(4),A={textures:[],min:[],max:[],resolution:[]};let D=null,E=null;const x=[],T=[];let H=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ji,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const F=this;let k=!1,G=null,W=null,z=null,j=null;this._outputColorSpace=Cn;let rt=0,$=0,st=null,tt=-1,Y=null;const lt=new Ze,St=new Ze;let Dt=null;const J=new Qt(0);let Mt=0,yt=e.width,Wt=e.height,Rt=1,jt=null,we=null;const Jt=new Ze(0,0,yt,Wt),fe=new Ze(0,0,yt,Wt);let ve=!1;const ce=new mo,We=new hh;let He=!1,Qe=!1;const Re=new Ae,Ln=new nt,ze=new Ze,je={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let fn=!1;function Sn(){return st===null?Rt:1}let K=i;function tn(P,Z){return e.getContext(P,Z)}let Pe,Ie,Ct,ke,Yt,te,O,R,ht,N,U,X,it,q,ot,_t,B,at,et,vt,gt,mt,Ot;try{const P={alpha:!0,depth:r,stencil:a,antialias:h,premultipliedAlpha:u,preserveDrawingBuffer:d,powerPreference:m,failIfMajorPerformanceCaveat:_};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Yc}`),e.addEventListener("webglcontextlost",kt,!1),e.addEventListener("webglcontextrestored",qt,!1),e.addEventListener("webglcontextcreationerror",Pt,!1),K===null){const Z="webgl2";if(K=tn(Z,P),K===null)throw tn(Z)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ft()}catch(P){throw e.removeEventListener("webglcontextlost",kt,!1),e.removeEventListener("webglcontextrestored",qt,!1),e.removeEventListener("webglcontextcreationerror",Pt,!1),Te("WebGLRenderer: "+P.message),P}function Ft(){Pe=new Bv(K),Pe.init(),gt=new TM(K,Pe),Ie=new Rv(K,Pe,t,gt),Ct=new bM(K,Pe),Ie.reversedDepthBuffer&&p&&Ct.buffers.depth.setReversed(!0),W=K.createFramebuffer(),z=K.createFramebuffer(),j=K.createFramebuffer(),ke=new Gv(K),Yt=new hM,te=new EM(K,Pe,Ct,Yt,Ie,gt,ke),O=new zv(F),R=new W_(K),mt=new Tv(K,R),ht=new kv(K,R,ke,mt),N=new Wv(K,ht,R,mt,ke),at=new Vv(K,Ie,te),ot=new Pv(Yt),U=new cM(F,O,Pe,Ie,mt,ot),X=new IM(F,Yt),it=new dM,q=new vM(Pe),B=new Ev(F,O,Ct,N,y,u),_t=new wM(F,N,Ie),Ot=new DM(K,ke,Ie,Ct),et=new Av(K,Pe,ke),vt=new Hv(K,Pe,ke),ke.programs=U.programs,F.capabilities=Ie,F.extensions=Pe,F.properties=Yt,F.renderLists=it,F.shadowMap=_t,F.state=Ct,F.info=ke}w!==Yn&&(H=new Zv(w,e.width,e.height,h,r,a));const xt=new CM(F,K);this.xr=xt,this.getContext=function(){return K},this.getContextAttributes=function(){return K.getContextAttributes()},this.forceContextLoss=function(){const P=Pe.get("WEBGL_lose_context");P&&P.loseContext()},this.forceContextRestore=function(){const P=Pe.get("WEBGL_lose_context");P&&P.restoreContext()},this.getPixelRatio=function(){return Rt},this.setPixelRatio=function(P){P!==void 0&&(Rt=P,this.setSize(yt,Wt,!1))},this.getSize=function(P){return P.set(yt,Wt)},this.setSize=function(P,Z,dt=!0){if(xt.isPresenting){re("WebGLRenderer: Can't change size while VR device is presenting.");return}yt=P,Wt=Z,e.width=Math.floor(P*Rt),e.height=Math.floor(Z*Rt),dt===!0&&(e.style.width=P+"px",e.style.height=Z+"px"),H!==null&&H.setSize(e.width,e.height),this.setViewport(0,0,P,Z)},this.getDrawingBufferSize=function(P){return P.set(yt*Rt,Wt*Rt).floor()},this.setDrawingBufferSize=function(P,Z,dt){yt=P,Wt=Z,Rt=dt,e.width=Math.floor(P*dt),e.height=Math.floor(Z*dt),this.setViewport(0,0,P,Z)},this.setEffects=function(P){if(w===Yn){Te("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(P){for(let Z=0;Z<P.length;Z++)if(P[Z].isOutputPass===!0){re("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}H.setEffects(P||[])},this.getCurrentViewport=function(P){return P.copy(lt)},this.getViewport=function(P){return P.copy(Jt)},this.setViewport=function(P,Z,dt,ct){P.isVector4?Jt.set(P.x,P.y,P.z,P.w):Jt.set(P,Z,dt,ct),Ct.viewport(lt.copy(Jt).multiplyScalar(Sn()).round())},this.getScissor=function(P){return P.copy(fe)},this.setScissor=function(P,Z,dt,ct){P.isVector4?fe.set(P.x,P.y,P.z,P.w):fe.set(P,Z,dt,ct),Ct.scissor(St.copy(fe).multiplyScalar(Sn()).round())},this.getScissorTest=function(){return ve},this.setScissorTest=function(P){Ct.setScissorTest(ve=P)},this.setOpaqueSort=function(P){jt=P},this.setTransparentSort=function(P){we=P},this.getClearColor=function(P){return P.copy(B.getClearColor())},this.setClearColor=function(){B.setClearColor(...arguments)},this.getClearAlpha=function(){return B.getClearAlpha()},this.setClearAlpha=function(){B.setClearAlpha(...arguments)},this.clear=function(P=!0,Z=!0,dt=!0){let ct=0;if(P){let Q=!1;if(st!==null){const wt=st.texture.format;Q=M.has(wt)}if(Q){const wt=st.texture.type,Vt=v.has(wt),At=B.getClearColor(),Ut=B.getClearAlpha(),Zt=At.r,It=At.g,$t=At.b;Vt?(b[0]=Zt,b[1]=It,b[2]=$t,b[3]=Ut,K.clearBufferuiv(K.COLOR,0,b)):(I[0]=Zt,I[1]=It,I[2]=$t,I[3]=Ut,K.clearBufferiv(K.COLOR,0,I))}else ct|=K.COLOR_BUFFER_BIT}Z&&(ct|=K.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),dt&&(ct|=K.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ct!==0&&K.clear(ct)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(P){P.setRenderer(this),G=P},this.dispose=function(){e.removeEventListener("webglcontextlost",kt,!1),e.removeEventListener("webglcontextrestored",qt,!1),e.removeEventListener("webglcontextcreationerror",Pt,!1),B.dispose(),it.dispose(),q.dispose(),te.dispose(),Yt.dispose(),O.dispose(),N.dispose(),ht.dispose(),mt.dispose(),Ot.dispose(),U.dispose(),xt.dispose(),xt.removeEventListener("sessionstart",Ws),xt.removeEventListener("sessionend",Lr),Bn.stop()};function kt(P){P.preventDefault(),yu("WebGLRenderer: Context Lost."),k=!0}function qt(){yu("WebGLRenderer: Context Restored."),k=!1;const P=ke.autoReset,Z=_t.enabled,dt=_t.autoUpdate,ct=_t.needsUpdate,Q=_t.type;Ft(),ke.autoReset=P,_t.enabled=Z,_t.autoUpdate=dt,_t.needsUpdate=ct,_t.type=Q}function Pt(P){Te("WebGLRenderer: A WebGL context could not be created. Reason: ",P.statusMessage)}function ne(P){const Z=P.target;Z.removeEventListener("dispose",ne),Lt(Z)}function Lt(P){Tn(P),Yt.remove(P)}function Tn(P){const Z=Yt.get(P).programs;Z!==void 0&&(Z.forEach(function(dt){U.releaseProgram(dt)}),P.isShaderMaterial&&U.releaseShaderCache(P))}this.renderBufferDirect=function(P,Z,dt,ct,Q,wt){Z===null&&(Z=je);const Vt=Q.isMesh&&Q.matrixWorld.determinantAffine()<0,At=$a(P,Z,dt,ct,Q);Ct.setMaterial(ct,Vt);let Ut=dt.index,Zt=1;if(ct.wireframe===!0){if(Ut=ht.getWireframeAttribute(dt),Ut===void 0)return;Zt=2}const It=dt.drawRange,$t=dt.attributes.position;let Xt=It.start*Zt,he=(It.start+It.count)*Zt;wt!==null&&(Xt=Math.max(Xt,wt.start*Zt),he=Math.min(he,(wt.start+wt.count)*Zt)),Ut!==null?(Xt=Math.max(Xt,0),he=Math.min(he,Ut.count)):$t!=null&&(Xt=Math.max(Xt,0),he=Math.min(he,$t.count));const be=he-Xt;if(be<0||be===1/0)return;mt.setup(Q,ct,At,dt,Ut);let Ne,Ee=et;if(Ut!==null&&(Ne=R.get(Ut),Ee=vt,Ee.setIndex(Ne)),Q.isMesh)ct.wireframe===!0?(Ct.setLineWidth(ct.wireframeLinewidth*Sn()),Ee.setMode(K.LINES)):Ee.setMode(K.TRIANGLES);else if(Q.isLine){let Ge=ct.linewidth;Ge===void 0&&(Ge=1),Ct.setLineWidth(Ge*Sn()),Q.isLineSegments?Ee.setMode(K.LINES):Q.isLineLoop?Ee.setMode(K.LINE_LOOP):Ee.setMode(K.LINE_STRIP)}else Q.isPoints?Ee.setMode(K.POINTS):Q.isSprite&&Ee.setMode(K.TRIANGLES);if(Q.isBatchedMesh)if(Pe.get("WEBGL_multi_draw"))Ee.renderMultiDraw(Q._multiDrawStarts,Q._multiDrawCounts,Q._multiDrawCount);else{const Ge=Q._multiDrawStarts,Nt=Q._multiDrawCounts,Xe=Q._multiDrawCount,ge=Ut?R.get(Ut).bytesPerElement:1,Gn=Yt.get(ct).currentProgram.getUniforms();for(let en=0;en<Xe;en++)Gn.setValue(K,"_gl_DrawID",en),Ee.render(Ge[en]/ge,Nt[en])}else if(Q.isInstancedMesh)Ee.renderInstances(Xt,be,Q.count);else if(dt.isInstancedBufferGeometry){const Ge=dt._maxInstanceCount!==void 0?dt._maxInstanceCount:1/0,Nt=Math.min(dt.instanceCount,Ge);Ee.renderInstances(Xt,be,Nt)}else Ee.render(Xt,be)};function Ni(P,Z,dt,ct){G!==null&&P.isNodeMaterial&&G.setObject(ct,P),He===!0&&ot.setState(P,dt,!1),P.transparent===!0&&P.side===$n&&P.forceSinglePass===!1?(P.side=zn,P.needsUpdate=!0,ws(P,Z,ct),P.side=es,P.needsUpdate=!0,ws(P,Z,ct),P.side=$n):ws(P,Z,ct)}this.compile=function(P,Z,dt=null){dt===null&&(dt=P),G!==null&&G.renderStart(P,Z,dt),E=q.get(dt),E.init(Z),T.push(E),dt.traverseVisible(function(Q){Q.isLight&&Q.layers.test(Z.layers)&&(E.pushLight(Q),Q.castShadow&&E.pushShadow(Q))}),P!==dt&&P.traverseVisible(function(Q){Q.isLight&&Q.layers.test(Z.layers)&&(E.pushLight(Q),Q.castShadow&&E.pushShadow(Q))}),E.setupLights(),G!==null&&G.updateLights(E.state.lightsArray),Qe=this.localClippingEnabled,He=ot.init(this.clippingPlanes,Qe),He===!0&&ot.setGlobalState(this.clippingPlanes,Z),G!==null&&_t.render(E.state.shadowsArray,dt,Z);const ct=new Set;return P.traverse(function(Q){if(!(Q.isMesh||Q.isPoints||Q.isLine||Q.isSprite))return;const wt=Q.material;if(wt)if(Array.isArray(wt))for(let Vt=0;Vt<wt.length;Vt++){const At=wt[Vt];Ni(At,dt,Z,Q),ct.add(At)}else Ni(wt,dt,Z,Q),ct.add(wt)}),E=T.pop(),G!==null&&G.renderEnd(),ct},this.compileAsync=function(P,Z,dt=null){const ct=this.compile(P,Z,dt);return new Promise(Q=>{function wt(){if(ct.forEach(function(Vt){const Ut=Yt.get(Vt).currentProgram;(Ut===void 0||Ut.isReady())&&ct.delete(Vt)}),ct.size===0){Q(P);return}setTimeout(wt,10)}Pe.get("KHR_parallel_shader_compile")!==null?wt():setTimeout(wt,10)})};let Fi=null;function ns(P){Fi&&Fi(P)}function Ws(){Bn.stop()}function Lr(){Bn.start()}const Bn=new Rf;Bn.setAnimationLoop(ns),typeof self<"u"&&Bn.setContext(self),this.setAnimationLoop=function(P){Fi=P,xt.setAnimationLoop(P),P===null?Bn.stop():Bn.start()},xt.addEventListener("sessionstart",Ws),xt.addEventListener("sessionend",Lr),this.render=function(P,Z){if(Z!==void 0&&Z.isCamera!==!0){Te("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(k===!0)return;G!==null&&G.renderStart(P,Z);const dt=xt.enabled===!0&&xt.isPresenting===!0,ct=H!==null&&(st===null||dt)&&H.begin(F,st);if(P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),Z.parent===null&&Z.matrixWorldAutoUpdate===!0&&Z.updateMatrixWorld(),xt.enabled===!0&&xt.isPresenting===!0&&(H===null||H.isCompositing()===!1)&&(xt.cameraAutoUpdate===!0&&xt.updateCamera(Z),Z=xt.getCamera()),P.isScene===!0&&P.onBeforeRender(F,P,Z,st),E=q.get(P,T.length),E.init(Z),E.state.textureUnits=te.getTextureUnits(),T.push(E),Re.multiplyMatrices(Z.projectionMatrix,Z.matrixWorldInverse),Z.isArrayCamera?We.setFromArrayCamera(Z):ce.setFromProjectionMatrix(Re,mi,Z.reversedDepth),Qe=this.localClippingEnabled,He=ot.init(this.clippingPlanes,Qe),D=it.get(P,x.length),D.init(),x.push(D),this.info.render.frame++,xt.enabled===!0&&xt.isPresenting===!0){const Vt=F.xr.getDepthSensingMesh();Vt!==null&&Xs(Vt,Z,-1/0,F.sortObjects)}Xs(P,Z,0,F.sortObjects),D.finish(),G!==null&&G.updateLights(E.state.lightsArray),F.sortObjects===!0&&D.sort(jt,we),fn=xt.enabled===!1||xt.isPresenting===!1||xt.hasDepthSensing()===!1,fn&&B.addToRenderList(D,P),this.info.autoReset===!0&&this.info.reset(),He===!0&&ot.beginShadows();const Q=E.state.shadowsArray;if(_t.render(Q,P,Z),He===!0&&ot.endShadows(),(ct&&H.hasRenderPass())===!1){const Vt=D.opaque,At=D.transmissive;if(E.setupLights(),Z.isArrayCamera){const Ut=Z.cameras;if(At.length>0)for(let Zt=0,It=Ut.length;Zt<It;Zt++){const $t=Ut[Zt];wo(Vt,At,P,$t)}fn&&B.render(P);for(let Zt=0,It=Ut.length;Zt<It;Zt++){const $t=Ut[Zt];So(D,P,$t,$t.viewport)}}else At.length>0&&wo(Vt,At,P,Z),fn&&B.render(P),So(D,P,Z)}st!==null&&$===0&&(te.updateMultisampleRenderTarget(st),te.updateRenderTargetMipmap(st)),ct&&H.end(F),P.isScene===!0&&P.onAfterRender(F,P,Z),mt.resetDefaultState(),tt=-1,Y=null,T.pop(),T.length>0?(E=T[T.length-1],te.setTextureUnits(E.state.textureUnits),He===!0&&ot.setGlobalState(F.clippingPlanes,E.state.camera)):E=null,x.pop(),x.length>0?D=x[x.length-1]:D=null,G!==null&&G.renderEnd()};function Xs(P,Z,dt,ct){if(P.visible===!1)return;if(P.layers.test(Z.layers)){if(P.isGroup)dt=P.renderOrder;else if(P.isLOD)P.autoUpdate===!0&&P.update(Z);else if(P.isLight)E.pushLight(P),P.castShadow&&E.pushShadow(P);else if(P.isSprite){const Vt=Z.isArrayCamera?We:ce;if(!P.frustumCulled||P.intersectsFrustum(Vt)){ct&&ze.setFromMatrixPosition(P.matrixWorld).applyMatrix4(Re);const At=N.update(P),Ut=P.material;Ut.visible&&D.push(P,At,Ut,dt,ze.z,null,Z)}}else if(P.isMesh||P.isLine||P.isPoints){const Vt=Z.isArrayCamera?We:ce;if(!P.frustumCulled||P.intersectsFrustum(Vt)){const At=N.update(P),Ut=P.material;if(ct&&(P.boundingSphere!==void 0?(P.boundingSphere===null&&P.computeBoundingSphere(),ze.copy(P.boundingSphere.center)):(At.boundingSphere===null&&At.computeBoundingSphere(),ze.copy(At.boundingSphere.center)),ze.applyMatrix4(P.matrixWorld).applyMatrix4(Re)),Array.isArray(Ut)){const Zt=At.groups;for(let It=0,$t=Zt.length;It<$t;It++){const Xt=Zt[It],he=Ut[Xt.materialIndex];he&&he.visible&&D.push(P,At,he,dt,ze.z,Xt,Z)}}else Ut.visible&&D.push(P,At,Ut,dt,ze.z,null,Z)}}}const wt=P.children;for(let Vt=0,At=wt.length;Vt<At;Vt++)Xs(wt[Vt],Z,dt,ct)}function So(P,Z,dt,ct){const{opaque:Q,transmissive:wt,transparent:Vt}=P;E.setupLightsView(dt),He===!0&&ot.setGlobalState(F.clippingPlanes,dt),ct&&Ct.viewport(lt.copy(ct)),Q.length>0&&Zs(Q,Z,dt),wt.length>0&&Zs(wt,Z,dt),Vt.length>0&&Zs(Vt,Z,dt),Ct.buffers.depth.setTest(!0),Ct.buffers.depth.setMask(!0),Ct.buffers.color.setMask(!0),Ct.setPolygonOffset(!1)}function wo(P,Z,dt,ct){if((dt.isScene===!0?dt.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[ct.id]===void 0){const Xt=Pe.has("EXT_color_buffer_half_float")||Pe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[ct.id]=new vi(1,1,{generateMipmaps:!0,type:Xt?Li:Yn,minFilter:Ki,samples:Math.max(4,Ie.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:xe.workingColorSpace})}const wt=E.state.transmissionRenderTarget[ct.id],Vt=ct.viewport||lt;wt.setSize(Vt.z*F.transmissionResolutionScale,Vt.w*F.transmissionResolutionScale);const At=F.getRenderTarget(),Ut=F.getActiveCubeFace(),Zt=F.getActiveMipmapLevel();F.setRenderTarget(wt),F.getClearColor(J),Mt=F.getClearAlpha(),Mt<1&&F.setClearColor(16777215,.5),F.clear(),fn&&B.render(dt);const It=F.toneMapping;F.toneMapping=Ji;const $t=ct.viewport;if(ct.viewport!==void 0&&(ct.viewport=void 0),E.setupLightsView(ct),He===!0&&ot.setGlobalState(F.clippingPlanes,ct),Zs(P,dt,ct),te.updateMultisampleRenderTarget(wt),te.updateRenderTargetMipmap(wt),Pe.has("WEBGL_multisampled_render_to_texture")===!1){let Xt=!1;for(let he=0,be=Z.length;he<be;he++){const Ne=Z[he],{object:Ee,geometry:Ge,material:Nt,group:Xe}=Ne;if(Nt.side===$n&&Ee.layers.test(ct.layers)){const ge=Nt.side;Nt.side=zn,Nt.needsUpdate=!0,bo(Ee,dt,ct,Ge,Nt,Xe),Nt.side=ge,Nt.needsUpdate=!0,Xt=!0}}Xt===!0&&(te.updateMultisampleRenderTarget(wt),te.updateRenderTargetMipmap(wt))}F.setRenderTarget(At,Ut,Zt),F.setClearColor(J,Mt),$t!==void 0&&(ct.viewport=$t),F.toneMapping=It}function Zs(P,Z,dt){const ct=Z.isScene===!0?Z.overrideMaterial:null;for(let Q=0,wt=P.length;Q<wt;Q++){const Vt=P[Q],{object:At,geometry:Ut,group:Zt}=Vt;let It=Vt.material;It.allowOverride===!0&&ct!==null&&(It=ct),At.layers.test(dt.layers)&&bo(At,Z,dt,Ut,It,Zt)}}function bo(P,Z,dt,ct,Q,wt){G!==null&&Q.isNodeMaterial&&G.setObject(P,Q),P.onBeforeRender(F,Z,dt,ct,Q,wt),P.modelViewMatrix.multiplyMatrices(dt.matrixWorldInverse,P.matrixWorld),P.normalMatrix.getNormalMatrix(P.modelViewMatrix),Q.onBeforeRender(F,Z,dt,ct,P,wt),Q.transparent===!0&&Q.side===$n&&Q.forceSinglePass===!1?(Q.side=zn,Q.needsUpdate=!0,F.renderBufferDirect(dt,Z,ct,Q,P,wt),Q.side=es,Q.needsUpdate=!0,F.renderBufferDirect(dt,Z,ct,Q,P,wt),Q.side=$n):F.renderBufferDirect(dt,Z,ct,Q,P,wt),P.onAfterRender(F,Z,dt,ct,Q,wt)}function Ir(P){let Z=0;for(const dt of P)dt.texture!==null&&Z++;return Z}function ws(P,Z,dt){Z.isScene!==!0&&(Z=je);const ct=Yt.get(P),Q=E.state.lights,wt=E.state.shadowsArray,Vt=Q.state.version,At=U.getParameters(P,Q.state,wt,Z,dt,E.state.lightProbeGridArray),Ut=U.getProgramCacheKey(At);let Zt=ct.programs;ct.environment=P.isMeshStandardMaterial||P.isMeshLambertMaterial||P.isMeshPhongMaterial?Z.environment:null,ct.fog=Z.fog;const It=P.isMeshStandardMaterial||P.isMeshLambertMaterial&&!P.envMap||P.isMeshPhongMaterial&&!P.envMap;ct.envMap=O.get(P.envMap||ct.environment,It),ct.envMapRotation=ct.environment!==null&&P.envMap===null?Z.environmentRotation:P.envMapRotation,Zt===void 0&&(P.addEventListener("dispose",ne),Zt=new Map,ct.programs=Zt,ct.programVariants=new Map);let $t=Zt.get(Ut);if($t!==void 0){if(ct.currentProgram===$t&&ct.lightsStateVersion===Vt)return To(P,At),$t}else At.uniforms=U.getUniforms(P),G!==null&&P.isNodeMaterial&&G.build(P,dt,At),P.onBeforeCompile(At,F),$t=U.acquireProgram(At,Ut),Zt.set(Ut,$t),ct.uniforms=At.uniforms;const Xt=ct.uniforms;return(!P.isShaderMaterial&&!P.isRawShaderMaterial||P.clipping===!0)&&(Xt.clippingPlanes=ot.uniform),To(P,At),ct.needsLights=Ka(P),ct.lightsStateVersion=Vt,ct.needsLights&&(Xt.ambientLightColor.value=Q.state.ambient,Xt.lightProbe.value=Q.state.probe,Xt.sunLights.value=Q.state.sun,Xt.sunLightShadows.value=Q.state.sunShadow,Xt.directionalLights.value=Q.state.directional,Xt.directionalLightShadows.value=Q.state.directionalShadow,Xt.spotLights.value=Q.state.spot,Xt.spotLightShadows.value=Q.state.spotShadow,Xt.rectAreaLights.value=Q.state.rectArea,Xt.ltc_1.value=Q.state.rectAreaLTC1,Xt.ltc_2.value=Q.state.rectAreaLTC2,Xt.pointLights.value=Q.state.point,Xt.pointLightShadows.value=Q.state.pointShadow,Xt.hemisphereLights.value=Q.state.hemi,Xt.sunShadowMatrix.value=Q.state.sunShadowMatrix,Xt.sunShadowCascade.value=Q.state.sunShadowCascade,Xt.directionalShadowMatrix.value=Q.state.directionalShadowMatrix,Xt.spotLightMatrix.value=Q.state.spotLightMatrix,Xt.spotLightMap.value=Q.state.spotLightMap,Xt.pointShadowMatrix.value=Q.state.pointShadowMatrix),ct.numLightProbeGrids=Ir(E.state.lightProbeGridArray),ct.currentProgram=$t,ct.uniformsList=null,$t}function qs(P,Z,dt,ct,Q){const wt=Yt.get(P),Vt=wt.currentProgram.id+","+ct+","+Q;let At=wt.programVariants.get(Vt);return At===void 0?(At=ws(P,Z,dt),wt.programVariants.set(Vt,At)):(wt.currentProgram=At,wt.uniformsList=null,wt.outputColorSpace=ct,wt.toneMapping=Q),At}function Eo(P){if(P.uniformsList===null){const Z=P.currentProgram.getUniforms();P.uniformsList=Sa.seqWithValue(Z.seq,P.uniforms)}return P.uniformsList}function To(P,Z){const dt=Yt.get(P);dt.outputColorSpace=Z.outputColorSpace,dt.batching=Z.batching,dt.batchingColor=Z.batchingColor,dt.instancing=Z.instancing,dt.instancingColor=Z.instancingColor,dt.instancingMorph=Z.instancingMorph,dt.skinning=Z.skinning,dt.morphTargets=Z.morphTargets,dt.morphNormals=Z.morphNormals,dt.morphColors=Z.morphColors,dt.morphTargetsCount=Z.morphTargetsCount,dt.numClippingPlanes=Z.numClippingPlanes,dt.numIntersection=Z.numClipIntersection,dt.vertexAlphas=Z.vertexAlphas,dt.vertexTangents=Z.vertexTangents,dt.toneMapping=Z.toneMapping}function $a(P,Z,dt,ct,Q){Z.isScene!==!0&&(Z=je),te.resetTextureUnits();const wt=Z.fog,Vt=ct.isMeshStandardMaterial||ct.isMeshLambertMaterial||ct.isMeshPhongMaterial?Z.environment:null,At=st===null?F.outputColorSpace:st.isXRRenderTarget===!0?st.texture.colorSpace:xe.workingColorSpace,Ut=ct.isMeshStandardMaterial||ct.isMeshLambertMaterial&&!ct.envMap||ct.isMeshPhongMaterial&&!ct.envMap,Zt=O.get(ct.envMap||Vt,Ut),It=ct.vertexColors===!0&&!!dt.attributes.color&&dt.attributes.color.itemSize===4,$t=!!dt.attributes.tangent&&(!!ct.normalMap||ct.anisotropy>0),Xt=!!dt.morphAttributes.position,he=!!dt.morphAttributes.normal,be=!!dt.morphAttributes.color;let Ne=Ji;ct.toneMapped&&(st===null||st.isXRRenderTarget===!0)&&(Ne=F.toneMapping);const Ee=dt.morphAttributes.position||dt.morphAttributes.normal||dt.morphAttributes.color,Ge=Ee!==void 0?Ee.length:0,Nt=Yt.get(ct),Xe=E.state.lights;if(He===!0&&(Qe===!0||P!==Y)){const Fe=P===Y&&ct.id===tt;ot.setState(ct,P,Fe)}let ge=!1,Gn=!1;ct.version===Nt.__version?Nt.needsLights&&Nt.lightsStateVersion!==Xe.state.version||Q.isBatchedMesh&&Nt.batching===!1||!Q.isBatchedMesh&&Nt.batching===!0||Q.isBatchedMesh&&Nt.batchingColor===!0&&Q._colorsTexture===null||Q.isBatchedMesh&&Nt.batchingColor===!1&&Q._colorsTexture!==null||Q.isInstancedMesh&&Nt.instancing===!1||!Q.isInstancedMesh&&Nt.instancing===!0||Q.isSkinnedMesh&&Nt.skinning===!1||!Q.isSkinnedMesh&&Nt.skinning===!0||Q.isInstancedMesh&&Nt.instancingColor===!0&&Q.instanceColor===null||Q.isInstancedMesh&&Nt.instancingColor===!1&&Q.instanceColor!==null||Q.isInstancedMesh&&Nt.instancingMorph===!0&&Q.morphTexture===null||Q.isInstancedMesh&&Nt.instancingMorph===!1&&Q.morphTexture!==null||Nt.envMap!==Zt||ct.fog===!0&&Nt.fog!==wt||Nt.numClippingPlanes!==void 0&&(Nt.numClippingPlanes!==ot.numPlanes||Nt.numIntersection!==ot.numIntersection)||Nt.vertexAlphas!==It||Nt.vertexTangents!==$t||Nt.morphTargets!==Xt||Nt.morphNormals!==he||Nt.morphColors!==be||Nt.morphTargetsCount!==Ge||Nt.numLightProbeGrids!==Ir(E.state.lightProbeGridArray)?ge=!0:(Nt.outputColorSpace!==At||Nt.toneMapping!==Ne)&&(Gn=!0):(ge=!0,Nt.__version=ct.version);let en=Nt.currentProgram;(ge===!0||Gn===!0)&&(en=Gn===!0?qs(ct,Z,Q,At,Ne):ws(ct,Z,Q),G&&ct.isNodeMaterial&&G.onUpdateProgram(ct,en,Nt));let xi=!1,Qn=!1,ri=!1;const me=en.getUniforms(),$e=Nt.uniforms;if(Ct.useProgram(en.program)&&(xi=!0,Qn=!0,ri=!0),ct.id!==tt&&(tt=ct.id,Qn=!0),xi||Y!==P){Ct.buffers.depth.getReversed()&&P.reversedDepth!==!0&&(P._reversedDepth=!0,P.updateProjectionMatrix()),me.setValue(K,"projectionMatrix",P.projectionMatrix),me.setValue(K,"viewMatrix",P.matrixWorldInverse);const Ye=me.map.cameraPosition;Ye!==void 0&&Ye.setValue(K,Ln.setFromMatrixPosition(P.matrixWorld)),Ie.logarithmicDepthBuffer&&me.setValue(K,"logDepthBufFC",2/(Math.log(P.far+1)/Math.LN2)),(ct.isMeshPhongMaterial||ct.isMeshToonMaterial||ct.isMeshLambertMaterial||ct.isMeshBasicMaterial||ct.isMeshStandardMaterial||ct.isShaderMaterial)&&me.setValue(K,"isOrthographic",P.isOrthographicCamera===!0),Y!==P&&(Y=P,Qn=!0,ri=!0)}if(Nt.needsLights&&(Xe.state.sunShadowMap.length>0&&me.setValue(K,"sunShadowMap",Xe.state.sunShadowMap,te),Xe.state.directionalShadowMap.length>0&&me.setValue(K,"directionalShadowMap",Xe.state.directionalShadowMap,te),Xe.state.spotShadowMap.length>0&&me.setValue(K,"spotShadowMap",Xe.state.spotShadowMap,te),Xe.state.pointShadowMap.length>0&&me.setValue(K,"pointShadowMap",Xe.state.pointShadowMap,te)),Q.isSkinnedMesh){me.setOptional(K,Q,"bindMatrix"),me.setOptional(K,Q,"bindMatrixInverse");const Fe=Q.skeleton;Fe&&(Fe.boneTexture===null&&Fe.computeBoneTexture(),me.setValue(K,"boneTexture",Fe.boneTexture,te))}Q.isBatchedMesh&&(me.setOptional(K,Q,"batchingTexture"),me.setValue(K,"batchingTexture",Q._matricesTexture,te),me.setOptional(K,Q,"batchingIdTexture"),me.setValue(K,"batchingIdTexture",Q._indirectTexture,te),me.setOptional(K,Q,"batchingColorTexture"),Q._colorsTexture!==null&&me.setValue(K,"batchingColorTexture",Q._colorsTexture,te));const In=dt.morphAttributes;if((In.position!==void 0||In.normal!==void 0||In.color!==void 0)&&at.update(Q,dt,en),(Qn||Nt.receiveShadow!==Q.receiveShadow)&&(Nt.receiveShadow=Q.receiveShadow,me.setValue(K,"receiveShadow",Q.receiveShadow)),(ct.isMeshStandardMaterial||ct.isMeshLambertMaterial||ct.isMeshPhongMaterial)&&ct.envMap===null&&Z.environment!==null&&($e.envMapIntensity.value=Z.environmentIntensity),$e.dfgLUT!==void 0&&($e.dfgLUT.value=FM()),Qn){if(me.setValue(K,"toneMappingExposure",F.toneMappingExposure),Nt.needsLights&&Ya($e,ri),wt&&ct.fog===!0&&X.refreshFogUniforms($e,wt),X.refreshMaterialUniforms($e,ct,Rt,Wt,E.state.transmissionRenderTarget[P.id]),Nt.needsLights&&Nt.numLightProbeGrids>0){const Fe=A;let Ye=0;for(const Vn of E.state.lightProbeGridArray)Vn.texture!==null&&(Fe.textures[Ye]=Vn.texture,Fe.min[Ye]=Vn.boundingBox.min,Fe.max[Ye]=Vn.boundingBox.max,Fe.resolution[Ye]=Vn.resolution,Ye++);for(const Vn in Fe)Fe[Vn].length=Ye;$e.probesSH.value=Fe.textures,$e.probesMin.value=Fe.min,$e.probesMax.value=Fe.max,$e.probesResolution.value=Fe.resolution}Sa.upload(K,Eo(Nt),$e,te)}if(ct.isShaderMaterial&&ct.uniformsNeedUpdate===!0&&(Sa.upload(K,Eo(Nt),$e,te),ct.uniformsNeedUpdate=!1),ct.isSpriteMaterial&&me.setValue(K,"center",Q.center),me.setValue(K,"modelViewMatrix",Q.modelViewMatrix),me.setValue(K,"normalMatrix",Q.normalMatrix),me.setValue(K,"modelMatrix",Q.matrixWorld),ct.uniformsGroups!==void 0){const Fe=ct.uniformsGroups;for(let Ye=0,Vn=Fe.length;Ye<Vn;Ye++){const Ao=Fe[Ye];Ot.update(Ao,en),Ot.bind(Ao,en)}}return en}function Ya(P,Z){P.ambientLightColor.needsUpdate=Z,P.lightProbe.needsUpdate=Z,P.sunLights.needsUpdate=Z,P.sunLightShadows.needsUpdate=Z,P.directionalLights.needsUpdate=Z,P.directionalLightShadows.needsUpdate=Z,P.pointLights.needsUpdate=Z,P.pointLightShadows.needsUpdate=Z,P.spotLights.needsUpdate=Z,P.spotLightShadows.needsUpdate=Z,P.rectAreaLights.needsUpdate=Z,P.hemisphereLights.needsUpdate=Z}function Ka(P){return P.isMeshLambertMaterial||P.isMeshToonMaterial||P.isMeshPhongMaterial||P.isMeshStandardMaterial||P.isShadowMaterial||P.isShaderMaterial&&P.lights===!0}this.getActiveCubeFace=function(){return rt},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return st},this.setRenderTargetTextures=function(P,Z,dt){const ct=Yt.get(P);ct.__autoAllocateDepthBuffer=P.resolveDepthBuffer===!1,ct.__autoAllocateDepthBuffer===!1&&(ct.__useRenderToTexture=!1),Yt.get(P.texture).__webglTexture=Z,Yt.get(P.depthTexture).__webglTexture=ct.__autoAllocateDepthBuffer?void 0:dt,ct.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(P,Z){const dt=Yt.get(P);dt.__webglFramebuffer=Z,dt.__useDefaultFramebuffer=Z===void 0},this.setRenderTarget=function(P,Z=0,dt=0){st=P,rt=Z,$=dt;let ct=null,Q=!1,wt=!1;if(P){const At=Yt.get(P);if(At.__useDefaultFramebuffer!==void 0){Ct.bindFramebuffer(K.FRAMEBUFFER,At.__webglFramebuffer),lt.copy(P.viewport),St.copy(P.scissor),Dt=P.scissorTest,Ct.viewport(lt),Ct.scissor(St),Ct.setScissorTest(Dt),tt=-1;return}else if(At.__webglFramebuffer===void 0)te.setupRenderTarget(P);else if(At.__hasExternalTextures)te.rebindTextures(P,Yt.get(P.texture).__webglTexture,Yt.get(P.depthTexture).__webglTexture);else if(P.depthBuffer){const It=P.depthTexture;if(At.__boundDepthTexture!==It){if(It!==null&&Yt.has(It)&&(P.width!==It.image.width||P.height!==It.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");te.setupDepthRenderbuffer(P)}}const Ut=P.texture;(Ut.isData3DTexture||Ut.isDataArrayTexture||Ut.isCompressedArrayTexture)&&(wt=!0);const Zt=Yt.get(P).__webglFramebuffer;P.isWebGLCubeRenderTarget?(Array.isArray(Zt[Z])?ct=Zt[Z][dt]:ct=Zt[Z],Q=!0):P.samples>0&&te.useMultisampledRTT(P)===!1?ct=Yt.get(P).__webglMultisampledFramebuffer:Array.isArray(Zt)?ct=Zt[dt]:ct=Zt,lt.copy(P.viewport),St.copy(P.scissor),Dt=P.scissorTest}else lt.copy(Jt).multiplyScalar(Rt).floor(),St.copy(fe).multiplyScalar(Rt).floor(),Dt=ve;if(dt!==0&&(ct=W),Ct.bindFramebuffer(K.FRAMEBUFFER,ct)&&Ct.drawBuffers(P,ct),Ct.viewport(lt),Ct.scissor(St),Ct.setScissorTest(Dt),Q){const At=Yt.get(P.texture);K.framebufferTexture2D(K.FRAMEBUFFER,K.COLOR_ATTACHMENT0,K.TEXTURE_CUBE_MAP_POSITIVE_X+Z,At.__webglTexture,dt)}else if(wt){const At=Z;for(let Ut=0;Ut<P.textures.length;Ut++){const Zt=Yt.get(P.textures[Ut]);K.framebufferTextureLayer(K.FRAMEBUFFER,K.COLOR_ATTACHMENT0+Ut,Zt.__webglTexture,dt,At)}}else if(P!==null&&dt!==0){const At=Yt.get(P.texture);K.framebufferTexture2D(K.FRAMEBUFFER,K.COLOR_ATTACHMENT0,K.TEXTURE_2D,At.__webglTexture,dt)}tt=-1};function $s(P){const Z=Yt.get(P);return(Z.__readFormat!==P.format||Z.__readType!==P.type)&&(Z.__readFormat=P.format,Z.__readType=P.type,Z.__formatReadable=Ie.textureFormatReadable(P.format),Z.__typeReadable=Ie.textureTypeReadable(P.type)),Z}this.readRenderTargetPixels=function(P,Z,dt,ct,Q,wt,Vt,At=0){if(!(P&&P.isWebGLRenderTarget)){Te("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ut=Yt.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&Vt!==void 0&&(Ut=Ut[Vt],Array.isArray(Ut)&&(Ut=Ut[0])),Ut){Ct.bindFramebuffer(K.FRAMEBUFFER,Ut);try{const Zt=P.textures[At],It=Zt.format,$t=Zt.type;P.textures.length>1&&K.readBuffer(K.COLOR_ATTACHMENT0+At);const Xt=$s(Zt);if(Xt.__formatReadable===!1){Te("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Xt.__typeReadable===!1){Te("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}Z>=0&&Z<=P.width-ct&&dt>=0&&dt<=P.height-Q&&K.readPixels(Z,dt,ct,Q,gt.convert(It),gt.convert($t),wt)}finally{const Zt=st!==null?Yt.get(st).__webglFramebuffer:null;Ct.bindFramebuffer(K.FRAMEBUFFER,Zt)}}},this.readRenderTargetPixelsAsync=async function(P,Z,dt,ct,Q,wt,Vt,At=0){if(!(P&&P.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ut=Yt.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&Vt!==void 0&&(Ut=Ut[Vt],Array.isArray(Ut)&&(Ut=Ut[0])),Ut)if(Z>=0&&Z<=P.width-ct&&dt>=0&&dt<=P.height-Q){Ct.bindFramebuffer(K.FRAMEBUFFER,Ut);const Zt=P.textures[At],It=Zt.format,$t=Zt.type;P.textures.length>1&&K.readBuffer(K.COLOR_ATTACHMENT0+At);const Xt=$s(Zt);if(Xt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Xt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const he=K.createBuffer();K.bindBuffer(K.PIXEL_PACK_BUFFER,he),K.bufferData(K.PIXEL_PACK_BUFFER,wt.byteLength,K.STREAM_READ),K.readPixels(Z,dt,ct,Q,gt.convert(It),gt.convert($t),0),K.bindBuffer(K.PIXEL_PACK_BUFFER,null);const be=st!==null?Yt.get(st).__webglFramebuffer:null;Ct.bindFramebuffer(K.FRAMEBUFFER,be);const Ne=K.fenceSync(K.SYNC_GPU_COMMANDS_COMPLETE,0);return K.flush(),await Bm(K,Ne,4),K.bindBuffer(K.PIXEL_PACK_BUFFER,he),K.getBufferSubData(K.PIXEL_PACK_BUFFER,0,wt),K.bindBuffer(K.PIXEL_PACK_BUFFER,null),K.deleteBuffer(he),K.deleteSync(Ne),wt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(P,Z=null,dt=0){const ct=Math.pow(2,-dt),Q=Math.floor(P.image.width*ct),wt=Math.floor(P.image.height*ct),Vt=Z!==null?Z.x:0,At=Z!==null?Z.y:0;te.setTexture2D(P,0),K.copyTexSubImage2D(K.TEXTURE_2D,dt,0,0,Vt,At,Q,wt),Ct.unbindTexture()},this.copyTextureToTexture=function(P,Z,dt=null,ct=null,Q=0,wt=0){let Vt,At,Ut,Zt,It,$t,Xt,he,be;const Ne=P.isCompressedTexture?P.mipmaps[wt]:P.image;if(dt!==null)Vt=dt.max.x-dt.min.x,At=dt.max.y-dt.min.y,Ut=dt.isBox3?dt.max.z-dt.min.z:1,Zt=dt.min.x,It=dt.min.y,$t=dt.isBox3?dt.min.z:0;else{const me=Math.pow(2,-Q);Vt=Math.floor(Ne.width*me),At=Math.floor(Ne.height*me),P.isDataArrayTexture?Ut=Ne.depth:P.isData3DTexture?Ut=Math.floor(Ne.depth*me):Ut=1,Zt=0,It=0,$t=0}ct!==null?(Xt=ct.x,he=ct.y,be=ct.z):(Xt=0,he=0,be=0);const Ee=gt.convert(Z.format),Ge=gt.convert(Z.type);let Nt;Z.isData3DTexture?(te.setTexture3D(Z,0),Nt=K.TEXTURE_3D):Z.isDataArrayTexture||Z.isCompressedArrayTexture?(te.setTexture2DArray(Z,0),Nt=K.TEXTURE_2D_ARRAY):(te.setTexture2D(Z,0),Nt=K.TEXTURE_2D),Ct.activeTexture(K.TEXTURE0),Ct.pixelStorei(K.UNPACK_FLIP_Y_WEBGL,Z.flipY),Ct.pixelStorei(K.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Z.premultiplyAlpha),Ct.pixelStorei(K.UNPACK_ALIGNMENT,Z.unpackAlignment);const Xe=Ct.getParameter(K.UNPACK_ROW_LENGTH),ge=Ct.getParameter(K.UNPACK_IMAGE_HEIGHT),Gn=Ct.getParameter(K.UNPACK_SKIP_PIXELS),en=Ct.getParameter(K.UNPACK_SKIP_ROWS),xi=Ct.getParameter(K.UNPACK_SKIP_IMAGES);Ct.pixelStorei(K.UNPACK_ROW_LENGTH,Ne.width),Ct.pixelStorei(K.UNPACK_IMAGE_HEIGHT,Ne.height),Ct.pixelStorei(K.UNPACK_SKIP_PIXELS,Zt),Ct.pixelStorei(K.UNPACK_SKIP_ROWS,It),Ct.pixelStorei(K.UNPACK_SKIP_IMAGES,$t);const Qn=P.isDataArrayTexture||P.isData3DTexture,ri=Z.isDataArrayTexture||Z.isData3DTexture;if(P.isDepthTexture){const me=Yt.get(P),$e=Yt.get(Z),In=Yt.get(me.__renderTarget),Fe=Yt.get($e.__renderTarget);Ct.bindFramebuffer(K.READ_FRAMEBUFFER,In.__webglFramebuffer),Ct.bindFramebuffer(K.DRAW_FRAMEBUFFER,Fe.__webglFramebuffer);for(let Ye=0;Ye<Ut;Ye++)Qn&&(K.framebufferTextureLayer(K.READ_FRAMEBUFFER,K.COLOR_ATTACHMENT0,Yt.get(P).__webglTexture,Q,$t+Ye),K.framebufferTextureLayer(K.DRAW_FRAMEBUFFER,K.COLOR_ATTACHMENT0,Yt.get(Z).__webglTexture,wt,be+Ye)),K.blitFramebuffer(Zt,It,Zt+Vt,It+At,Xt,he,Xt+Vt,he+At,K.DEPTH_BUFFER_BIT,K.NEAREST);Ct.bindFramebuffer(K.READ_FRAMEBUFFER,null),Ct.bindFramebuffer(K.DRAW_FRAMEBUFFER,null)}else if(Q!==0||P.isRenderTargetTexture||Yt.has(P)){const me=Yt.get(P),$e=Yt.get(Z);Ct.bindFramebuffer(K.READ_FRAMEBUFFER,z),Ct.bindFramebuffer(K.DRAW_FRAMEBUFFER,j);for(let In=0;In<Ut;In++)Qn?K.framebufferTextureLayer(K.READ_FRAMEBUFFER,K.COLOR_ATTACHMENT0,me.__webglTexture,Q,$t+In):K.framebufferTexture2D(K.READ_FRAMEBUFFER,K.COLOR_ATTACHMENT0,K.TEXTURE_2D,me.__webglTexture,Q),ri?K.framebufferTextureLayer(K.DRAW_FRAMEBUFFER,K.COLOR_ATTACHMENT0,$e.__webglTexture,wt,be+In):K.framebufferTexture2D(K.DRAW_FRAMEBUFFER,K.COLOR_ATTACHMENT0,K.TEXTURE_2D,$e.__webglTexture,wt),Q!==0?K.blitFramebuffer(Zt,It,Zt+Vt,It+At,Xt,he,Xt+Vt,he+At,K.COLOR_BUFFER_BIT,K.NEAREST):ri?K.copyTexSubImage3D(Nt,wt,Xt,he,be+In,Zt,It,Vt,At):K.copyTexSubImage2D(Nt,wt,Xt,he,Zt,It,Vt,At);Ct.bindFramebuffer(K.READ_FRAMEBUFFER,null),Ct.bindFramebuffer(K.DRAW_FRAMEBUFFER,null)}else ri?P.isDataTexture||P.isData3DTexture?K.texSubImage3D(Nt,wt,Xt,he,be,Vt,At,Ut,Ee,Ge,Ne.data):Z.isCompressedArrayTexture?K.compressedTexSubImage3D(Nt,wt,Xt,he,be,Vt,At,Ut,Ee,Ne.data):K.texSubImage3D(Nt,wt,Xt,he,be,Vt,At,Ut,Ee,Ge,Ne):P.isDataTexture?K.texSubImage2D(K.TEXTURE_2D,wt,Xt,he,Vt,At,Ee,Ge,Ne.data):P.isCompressedTexture?K.compressedTexSubImage2D(K.TEXTURE_2D,wt,Xt,he,Ne.width,Ne.height,Ee,Ne.data):K.texSubImage2D(K.TEXTURE_2D,wt,Xt,he,Vt,At,Ee,Ge,Ne);Ct.pixelStorei(K.UNPACK_ROW_LENGTH,Xe),Ct.pixelStorei(K.UNPACK_IMAGE_HEIGHT,ge),Ct.pixelStorei(K.UNPACK_SKIP_PIXELS,Gn),Ct.pixelStorei(K.UNPACK_SKIP_ROWS,en),Ct.pixelStorei(K.UNPACK_SKIP_IMAGES,xi),wt===0&&Z.generateMipmaps===!0&&Z.mipmapsAutoUpdate===!0&&K.generateMipmap(Nt),Ct.unbindTexture()},this.initRenderTarget=function(P){Yt.get(P).__webglFramebuffer===void 0&&te.setupRenderTarget(P)},this.initTexture=function(P){P.isCubeTexture?te.setTextureCube(P,0):P.isData3DTexture?te.setTexture3D(P,0):P.isDataArrayTexture||P.isCompressedArrayTexture?te.setTexture2DArray(P,0):te.setTexture2D(P,0),Ct.unbindTexture()},this.resetState=function(){rt=0,$=0,st=null,Ct.reset(),mt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return mi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=xe._getDrawingBufferColorSpace(t),e.unpackColorSpace=xe._getUnpackColorSpace()}}const io=6378137,xd=1/298.257222101,Ve=xd*(2-xd),Fs=Ve/(1-Ve),Ca=.9996,OM=33,Bf=((OM-1)*6-180+3)*Math.PI/180,kf=5e5,_o=Math.PI/180;function Hf(s,t){const e=s*_o,i=t*_o,r=Math.sin(e),a=Math.cos(e),l=Math.tan(e),h=io/Math.sqrt(1-Ve*r*r),u=l*l,d=Fs*a*a,m=a*(i-Bf),_=io*((1-Ve/4-3*Ve*Ve/64-5*Ve**3/256)*e-(3*Ve/8+3*Ve*Ve/32+45*Ve**3/1024)*Math.sin(2*e)+(15*Ve*Ve/256+45*Ve**3/1024)*Math.sin(4*e)-35*Ve**3/3072*Math.sin(6*e)),p=kf+Ca*h*(m+(1-u+d)*m**3/6+(5-18*u+u*u+72*d-58*Fs)*m**5/120),g=Ca*(_+h*l*(m*m/2+(5-u+9*d+4*d*d)*m**4/24+(61-58*u+u*u+600*d-330*Fs)*m**6/720));return{x:p,y:g}}function zM(s,t){const e=s-kf,a=t/Ca/(io*(1-Ve/4-3*Ve*Ve/64-5*Ve**3/256)),l=(1-Math.sqrt(1-Ve))/(1+Math.sqrt(1-Ve)),h=a+(3*l/2-27*l**3/32)*Math.sin(2*a)+(21*l*l/16-55*l**4/32)*Math.sin(4*a)+151*l**3/96*Math.sin(6*a)+1097*l**4/512*Math.sin(8*a),u=Math.sin(h),d=Math.cos(h),m=Math.tan(h),_=io/Math.sqrt(1-Ve*u*u),p=m*m,g=Fs*d*d,y=io*(1-Ve)/Math.pow(1-Ve*u*u,1.5),w=e/(_*Ca),M=h-_*m/y*(w*w/2-(5+3*p+10*g-4*g*g-9*Fs)*w**4/24+(61+90*p+298*g+45*p*p-252*Fs-3*g*g)*w**6/720),v=Bf+(w-(1+2*p+g)*w**3/6+(5-2*g+28*p-3*g*g+8*Fs+24*p*p)*w**5/120)/d;return{lat:M/_o,lon:v/_o}}function Gf(s,t){const e=s*_o,i=111132.92-559.82*Math.cos(2*e)+1.175*Math.cos(4*e)-.0023*Math.cos(6*e),r=111412.84*Math.cos(e)-93.5*Math.cos(3*e)+.118*Math.cos(5*e);return{lat0:s,lon0:t,mPerLat:i,mPerLon:r,worldFromLatLon(a,l){return{x:(l-t)*r,z:-(a-s)*i}},latLonFromWorld(a,l){return{lat:s-l/i,lon:t+a/r}}}}const zt=(s,t,e)=>Math.max(t,Math.min(e,s)),ye=(s,t,e)=>s+(t-s)*e,La=s=>s*s*(3-2*s),Fn=(s,t,e,i)=>ye(s,t,1-Math.exp(-e*i)),BM=s=>{for(;s>Math.PI;)s-=Math.PI*2;for(;s<-Math.PI;)s+=Math.PI*2;return s},Ia=s=>{if(!Number.isFinite(s))return"--:--.---";const t=Math.floor(s/60),e=Math.floor(s%60),i=Math.floor(s%1*1e3);return`${String(t).padStart(2,"0")}:${String(e).padStart(2,"0")}.${String(i).padStart(3,"0")}`},Da=({lat:s,lon:t})=>`${s.toFixed(5)}, ${t.toFixed(5)}`;function go(s,t,e=0){let i=Math.imul(s|0,374761393)+Math.imul(t|0,668265263)+Math.imul(e|0,1442695041);return i=Math.imul(i^i>>>13,1274126177),((i^i>>>16)>>>0)/4294967296}const Gl=512,kM=320,HM=-32767;async function GM(s,t){const e=await fetch(s);if(!e.ok)throw new Error(`Could not load ${s} (HTTP ${e.status})`);const i=Number(e.headers.get("content-length"))||0;if(!e.body){const d=await e.arrayBuffer();return t?.(1),d}const r=e.body.getReader(),a=[];let l=0;for(;;){const{done:d,value:m}=await r.read();if(d)break;a.push(m),l+=m.byteLength,i&&t?.(Math.min(.99,l/i))}t?.(1);const h=new Uint8Array(l);let u=0;for(const d of a)h.set(d,u),u+=d.byteLength;return h.buffer}function VM(s,t){const e=s.getFileDirectory?.()||{},i=e.ModelTiepoint,r=e.ModelPixelScale,a=s.getWidth(),l=s.getHeight();let h,u,d,m;if(i&&r&&i.length>=6&&r.length>=3){const _=i[3],p=i[4];h=_,u=_+a*r[0],m=p,d=p-l*r[1]}else if(t?.lat!=null&&t?.lon!=null){const _=Hf(t.lat,t.lon),p=t.radius||1e3;h=_.x-p,u=_.x+p,d=_.y-p,m=_.y+p}else throw new Error("The GeoTIFF has no georeferencing and scene.json has no centre.");return{width:a,height:l,xMin:h,xMax:u,yMin:d,yMax:m,originX:(h+u)/2,originY:(d+m)/2,sizeX:u-h,sizeZ:m-d}}function Vf({heights:s,grid:t,sizeX:e,sizeZ:i,projection:r,scene:a=null,basemapUrl:l=null,meta:h={}}){let u=1/0,d=-1/0;for(let g=0;g<s.length;g++){const y=s[g];y<u&&(u=y),y>d&&(d=y)}Number.isFinite(u)||(u=0,d=0);const m=e/(t-1),_=i/(t-1),p=s.slice();return{scene:a,meta:h,heights:s,basemapUrl:l,grid:t,sizeX:e,sizeZ:i,minH:u,maxH:d,cellX:m,cellZ:_,originX:h.originX??0,originY:h.originY??0,worldFromLatLon:(g,y)=>r.worldFromLatLon(g,y),latLonFromWorld:(g,y)=>r.latLonFromWorld(g,y),worldFromUtm:r.worldFromUtm?(g,y)=>r.worldFromUtm(g,y):null,utmFromWorld:r.utmFromWorld?(g,y)=>r.utmFromWorld(g,y):null,inside(g,y,w=0){return Math.abs(g)<=e/2-w&&Math.abs(y)<=i/2-w},sample(g,y){const w=(g+e/2)/e*(t-1),M=(y+i/2)/i*(t-1),v=zt(Math.floor(w),0,t-2),b=zt(Math.floor(M),0,t-2),I=zt(w-v,0,1),A=zt(M-b,0,1),D=s[b*t+v],E=s[b*t+v+1],x=s[(b+1)*t+v],T=s[(b+1)*t+v+1];return ye(ye(D,E,I),ye(x,T,I),A)},gradient(g,y,w=4){const M=(this.sample(g+w,y)-this.sample(g-w,y))/(2*w),v=(this.sample(g,y+w)-this.sample(g,y-w))/(2*w);return{gx:M,gz:v}},slope(g,y){const{gx:w,gz:M}=this.gradient(g,y);return Math.hypot(w,M)},normal(g,y,w=5){const{gx:M,gz:v}=this.gradient(g,y,w);return new nt(-M,1,-v).normalize()},resetHeights(){s.set(p)},carveRoad(g,{halfWidth:y=5.4,blend:w=7,lift:M=.12}={}){if(!g||g.length<2)return 0;const v=e/2,b=i/2,I=y+w,A=new Float32Array(t*t),D=new Float32Array(t*t);for(const x of g){const T=x.y+M,H=Math.max(0,Math.floor((x.x-I+v)/e*(t-1))-1),F=Math.min(t-1,Math.ceil((x.x+I+v)/e*(t-1))+1),k=Math.max(0,Math.floor((x.z-I+b)/i*(t-1))-1),G=Math.min(t-1,Math.ceil((x.z+I+b)/i*(t-1))+1);for(let W=k;W<=G;W++){const z=-b+W/(t-1)*i;for(let j=H;j<=F;j++){const rt=-v+j/(t-1)*e,$=Math.hypot(rt-x.x,z-x.z);if($>I)continue;const st=$<=y?1:1-La(($-y)/w),tt=W*t+j;st>A[tt]&&(A[tt]=st,D[tt]=T)}}}let E=0;for(let x=0;x<s.length;x++){const T=A[x];T<=.001||(s[x]=ye(s[x],D[x],T),E++)}return E},flattenPad(g,y,w=18,M=34,v=null){const b=v??this.sample(g,y),I=e/2,A=i/2,D=w+M;for(let E=0;E<t;E++){const x=-A+E/(t-1)*i;if(!(Math.abs(x-y)>D))for(let T=0;T<t;T++){const H=-I+T/(t-1)*e,F=Math.hypot(H-g,x-y);if(F>D)continue;const k=F<=w?1:1-La((F-w)/M),G=E*t+T;s[G]=ye(p[G],b,k)}}return b}}}async function WM({sceneUrl:s,tifUrl:t,onProgress:e,basemapUrl:i=null}){let r=null;try{const p=await fetch(s);p.ok&&(r=await p.json())}catch{r=null}e?.(.05,"Reading elevation model…");const a=await GM(t,p=>{e?.(.05+p*.5,`Loading elevation model… ${Math.round(p*100)}%`)});if(e?.(.6,"Unpacking GeoTIFF…"),!window.GeoTIFF)throw new Error("geotiff.js did not load.");const h=await(await window.GeoTIFF.fromArrayBuffer(a)).getImage(),u=VM(h,r);e?.(.72,"Building terrain grid…");const d=await h.readRasters({width:Gl,height:Gl,resampleMethod:"nearest"}),m=new Float32Array(d[0].length);for(let p=0;p<m.length;p++){const g=d[0][p];m[p]=g<=HM+100||!Number.isFinite(g)?0:Math.max(0,g)}const _=Vf({heights:m,grid:Gl,sizeX:u.sizeX,sizeZ:u.sizeZ,scene:r,basemapUrl:i,meta:u,projection:{worldFromUtm:(p,g)=>({x:p-u.originX,z:-(g-u.originY)}),utmFromWorld:(p,g)=>({x:p+u.originX,y:u.originY-g}),worldFromLatLon(p,g){const{x:y,y:w}=Hf(p,g);return{x:y-u.originX,z:-(w-u.originY)}},latLonFromWorld(p,g){return zM(p+u.originX,u.originY-g)}}});return e?.(.85,"Growing trees…"),_}function Ga(s,t,e,i,r){const a=go(Math.floor(e*.25),Math.floor(i*.25),91),l=go(Math.floor(e*.08),Math.floor(i*.08),17);let h,u,d;if(s<1.2)h=.19,u=.32,d=.34;else if(s<40)h=.24,u=.34,d=.22;else if(s<190){const w=(s-40)/150;h=ye(.23,.28,w),u=ye(.35,.39,w),d=ye(.2,.21,w)}else if(s<430){const w=(s-190)/240;h=ye(.28,.33,w),u=ye(.39,.4,w),d=ye(.21,.22,w)}else if(s<575){const w=(s-430)/145;h=ye(.33,.4,w),u=ye(.4,.39,w),d=ye(.22,.25,w)}else if(s<665){const w=(s-575)/90;h=ye(.4,.47,w),u=ye(.39,.45,w),d=ye(.25,.39,w)}else{const w=zt((s-665)/70,0,1);h=ye(.47,.62,w),u=ye(.45,.6,w),d=ye(.39,.54,w)}const m=zt((t-.55)*2.2,0,1),_=.34+l*.14,p=.33+l*.13,g=.3+l*.13;h=ye(h,_,m),u=ye(u,p,m),d=ye(d,g,m);const y=(a-.5)*.062;r.setRGB(zt(h+y,0,1),zt(u+y*1.1,0,1),zt(d+y*.55,0,1))}async function XM(s){if(!s)return null;try{const t=await new F_().loadAsync(s);return t.colorSpace=Cn,t.anisotropy=8,t.minFilter=Ki,t.magFilter=On,t.needsUpdate=!0,t}catch(t){return console.warn("Basemap could not be loaded:",s,t),null}}function ZM(s,t){const e=s.grid,i=new yn,r=new Float32Array(e*e*3),a=new Float32Array(e*e*2),l=s.sizeX/2,h=s.sizeZ/2;for(let p=0;p<e;p++){const g=-h+p/(e-1)*s.sizeZ;for(let y=0;y<e;y++){const w=p*e+y;r[w*3]=-l+y/(e-1)*s.sizeX,r[w*3+1]=s.heights[w],r[w*3+2]=g,a[w*2]=y/(e-1),a[w*2+1]=1-p/(e-1)}}const u=new Uint32Array((e-1)*(e-1)*6);let d=0;for(let p=0;p<e-1;p++)for(let g=0;g<e-1;g++){const y=p*e+g,w=y+1,M=y+e,v=M+1;u[d++]=y,u[d++]=M,u[d++]=w,u[d++]=w,u[d++]=M,u[d++]=v}i.setAttribute("position",new xn(r,3)),i.setAttribute("uv",new xn(a,2)),i.setIndex(new xn(u,1)),i.computeBoundingSphere();const m=new Hn({map:t,toneMapped:!1,fog:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),_=new pe(i,m);return _.name="basemap",_.renderOrder=1,_.receiveShadow=!1,_.castShadow=!1,_.visible=!1,_}function Wf(s){const t=new ii(9e3,9e3,48,48);t.rotateX(-Math.PI/2);const e=t.attributes.position.array.slice(),i=new Ii({transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uDeep:{value:new Qt(1527395)},uShallow:{value:new Qt(4034211)},uSun:{value:new nt(.45,.75,.3).normalize()},fogColor:{value:new Qt(12572900)},fogNear:{value:400},fogFar:{value:2600}},vertexShader:`
      uniform float uTime;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 p = position;
        float w = sin(p.x * 0.035 + uTime * 0.9) * 0.18
                + cos(p.z * 0.041 - uTime * 0.7) * 0.16
                + sin((p.x + p.z) * 0.015 + uTime * 0.4) * 0.12;
        p.y += w;
        vWave = w;
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,fragmentShader:`
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uSun;
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 2.0);
        float stripe = step(0.0, sin((vWorld.x + vWorld.z) * 0.09 + vWave * 9.0));
        vec3 col = mix(uDeep, uShallow, 0.25 + stripe * 0.10 + fres * 0.65);
        float glint = pow(max(dot(reflect(-uSun, vec3(0.0, 1.0, 0.0)), viewDir), 0.0), 24.0);
        col += vec3(1.0, 0.92, 0.72) * glint * 0.55;
        float dist = length(cameraPosition - vWorld);
        float fog = smoothstep(fogNear, fogFar, dist);
        col = mix(col, fogColor, fog);
        gl_FragColor = vec4(col, 0.88);
      }
    `}),r=new pe(t,i);return r.position.y=.45,r.renderOrder=2,r.frustumCulled=!1,r.userData.basePositions=e,r.userData.material=i,r}function qM(s,t,e=Math.random){const i=new hn,r=s.sizeX/2-25,a=s.sizeZ/2-25,l=1500,h=260,u=new ni(.22,.32,2.2,5),d=new Pr(1.7,5.2,5),m=new Ba(1,0),_=new qe({color:4863269,flatShading:!0}),p=new qe({color:3099442,flatShading:!0}),g=new qe({color:7827561,flatShading:!0}),y=new ji(u,_,l),w=new ji(d,p,l),M=new ji(m,g,h);y.castShadow=!0,w.castShadow=!0,w.receiveShadow=!0,M.castShadow=!0,M.receiveShadow=!0;const v=new Ae,b=new Kn,I=new nt,A=new nt,D=new Qt;let E=0,x=0;for(;E<l&&x<l*26;){x++;const H=(e()*2-1)*r,F=(e()*2-1)*a,k=s.sample(H,F);if(k<12||k>625||s.slope(H,F)>.62||t&&t.distanceTo(H,F)<9)continue;const W=.55+e()*.95,z=e()*Math.PI*2;b.setFromAxisAngle(new nt(0,1,0),z),I.set(H,k+1.1*W,F),A.set(W,W,W),v.compose(I,b,A),y.setMatrixAt(E,v),I.set(H,k+4.1*W,F),v.compose(I,b,A),w.setMatrixAt(E,v),D.setHSL(.31+e()*.035,.27+e()*.16,.18+e()*.1),w.setColorAt(E,D),E++}y.count=E,w.count=E;let T=0;for(x=0;T<h&&x<h*24;){x++;const H=(e()*2-1)*r,F=(e()*2-1)*a,k=s.sample(H,F);if(k<2||k>690||t&&t.distanceTo(H,F)<8)continue;const G=.5+e()*2.4,W=e()*Math.PI*2;b.setFromAxisAngle(new nt(0,1,0),W),I.set(H,k+G*.32,F),A.set(G*(.8+e()*.5),G*(.55+e()*.35),G*(.8+e()*.4)),v.compose(I,b,A),M.setMatrixAt(T++,v)}return M.count=T,y.instanceMatrix&&(y.instanceMatrix.needsUpdate=!0),w.instanceMatrix&&(w.instanceMatrix.needsUpdate=!0),w.instanceColor&&(w.instanceColor.needsUpdate=!0),M.instanceMatrix&&(M.instanceMatrix.needsUpdate=!0),i.add(y,w,M),i.name="vegetation",i}function $M(s,t=null){const e=document.createElement("canvas"),i=kM;e.width=i,e.height=i;const r=e.getContext("2d");if(t)return r.drawImage(t,0,0,i,i),e;const a=r.createImageData(i,i);s.grid;const l=new Qt;for(let h=0;h<i;h++)for(let u=0;u<i;u++){const d=(u/(i-1)-.5)*s.sizeX,m=(h/(i-1)-.5)*s.sizeZ,_=s.sample(d,m),p=s.slope(d,m);Ga(_,p,d,m,l);const g=s.sizeX/i,y=(s.sample(d+g,m)-s.sample(d-g,m))/(2*g),w=(s.sample(d,m+g)-s.sample(d,m-g))/(2*g),M=zt(.72+(-y*.7-w*.7)*1.2,.38,1.2),v=(h*i+u)*4;a.data[v]=zt(l.r*255*M,0,255),a.data[v+1]=zt(l.g*255*M,0,255),a.data[v+2]=zt(l.b*255*M,0,255),a.data[v+3]=255}return r.putImageData(a,0,0),e}const YM=[1,2,4],KM=6,Md=430,yd=1250;function JM(s,t,e,i,r,a){const l=s.grid,h=e-t,u=r-i,d=Math.ceil(h/a)+1,m=Math.ceil(u/a)+1,_=[],p=[];for(let $=0;$<d;$++)_.push(t+Math.min($*a,h));for(let $=0;$<m;$++)p.push(i+Math.min($*a,u));const g=s.sizeX/2,y=s.sizeZ/2,w=m,M=d,v=w*M,b=new Float32Array(v*3),I=new Float32Array(v*3),A=new Qt,D=s.sizeX/(l-1),E=s.sizeZ/(l-1),x=s.heights,T=($,st)=>x[Math.min(l-1,Math.max(0,st))*l+Math.min(l-1,Math.max(0,$))];for(let $=0;$<w;$++){const st=p[$],tt=-y+st*E;for(let Y=0;Y<M;Y++){const lt=_[Y],St=-g+lt*D,Dt=$*M+Y,J=x[st*l+lt];b[Dt*3]=St,b[Dt*3+1]=J,b[Dt*3+2]=tt;const Mt=(T(lt+a,st)-T(lt-a,st))/(2*D*a||1),yt=(T(lt,st+a)-T(lt,st-a))/(2*E*a||1);Ga(J,Math.hypot(Mt,yt),St,tt,A),I[Dt*3]=A.r,I[Dt*3+1]=A.g,I[Dt*3+2]=A.b}}const H=[];for(let $=0;$<w-1;$++)for(let st=0;st<M-1;st++){const tt=$*M+st,Y=tt+1,lt=tt+M,St=lt+1;H.push(tt,lt,Y,Y,lt,St)}const F=[],k=[],G=[],W=$=>{const st=[];if($==="north"||$==="south"){const Y=$==="north"?0:w-1;for(let lt=0;lt<M;lt++)st.push(Y*M+lt)}else{const Y=$==="west"?0:M-1;for(let lt=0;lt<w;lt++)st.push(lt*M+Y)}const tt=v+F.length/3;for(const Y of st){const lt=b[Y*3],St=b[Y*3+1],Dt=b[Y*3+2];F.push(lt,St-KM,Dt),k.push(I[Y*3]*.55,I[Y*3+1]*.55,I[Y*3+2]*.55)}for(let Y=0;Y<st.length-1;Y++){const lt=st[Y],St=st[Y+1],Dt=tt+Y,J=tt+Y+1;G.push(lt,Dt,St,St,Dt,J)}};W("north"),W("south"),W("west"),W("east");const z=new Float32Array(v*3+F.length);z.set(b,0),z.set(F,v*3);const j=new Float32Array(v*3+k.length);j.set(I,0),j.set(k,v*3);const rt=new yn;return rt.setAttribute("position",new xn(z,3)),rt.setAttribute("color",new xn(j,3)),rt.setIndex(H.concat(G)),rt.computeVertexNormals(),rt.computeBoundingSphere(),rt}function QM(s){const t=s.sizeX/2,e=s.sizeZ/2,i=Math.max(60,s.minH+80),r=new qe({color:2435880}),a=new hn;a.name="terrainWalls";const l=(h,u,d,m)=>{const _=new pe(new ii(h,i,1,1),r);_.rotation.y=m,_.position.set(u,-i/2-5,d),_.receiveShadow=!0,a.add(_)};return l(s.sizeX,0,-e,0),l(s.sizeX,0,e,Math.PI),l(s.sizeZ,-t,0,Math.PI/2),l(s.sizeZ,t,0,-Math.PI/2),a}function jM(s){const t=new hn;t.name="terrain";const e=new qe({vertexColors:!0,flatShading:!0,side:$n}),i=s.grid,r=Math.max(4,s.chunks??7),a=E=>Math.round(E*(i-1)/r),l=s.sizeX/(i-1),h=s.sizeZ/(i-1),u=[],d=[];let m=0,_=0,p=-1,g={x:1/0,z:1/0};for(let E=0;E<r;E++)for(let x=0;x<r;x++){const T=new pe(new yn,e);T.name=`terrain-${x}-${E}`,T.receiveShadow=!0,T.castShadow=!0,T.userData.isTerrainChunk=!0;const H=a(x),F=a(x+1),k=a(E),G=a(E+1),W={ci:x,cj:E,i0:H,i1:F,j0:k,j1:G,mesh:T,x0:-s.sizeX/2+H*l,z0:-s.sizeZ/2+k*h,x1:-s.sizeX/2+F*l,z1:-s.sizeZ/2+G*h,level:-1,geometries:[null,null,null]};u.push(W),t.add(T),d.push(T)}const y=new ys(new nt(-s.sizeX/2,s.minH,-s.sizeZ/2),new nt(s.sizeX/2,s.maxH,s.sizeZ/2));function w(E,x,T){const H=Math.max(E.x0-x,0,x-E.x1),F=Math.max(E.z0-T,0,T-E.z1);return Math.hypot(H,F)}function M(E,x){return E.geometries[x]||(E.geometries[x]=JM(s,E.i0,E.i1,E.j0,E.j1,YM[x])),E.geometries[x]}function v(E,x){E.level!==x&&(E.mesh.geometry=M(E,x),E.level=x,E.mesh.castShadow=x<=1,E.mesh.userData.lod=x)}function b(E,x,T=!1){const H=performance.now();if(!T&&H-p<180||!T&&Math.abs(E-g.x)<6&&Math.abs(x-g.z)<6)return!1;p=H,g={x:E,z:x};let F=0;for(const k of u){const G=w(k,E,x);let W;G<Md?W=0:G<yd?W=1:W=2,k.level>=0&&(k.level===0&&G<Md*1.2&&(W=0),k.level<=1&&W===2&&G<yd*1.15&&(W=1)),v(k,W);const z=k.mesh.geometry;F+=(z.index?.count||0)/3}return m=F,_=u.length,!0}function I(){for(const E of u){for(let x=0;x<E.geometries.length;x++)E.geometries[x]?.dispose(),E.geometries[x]=null;E.level=-1}for(const E of u)M(E,0),M(E,1),M(E,2);b(g.x,g.z,!0)}function A(){for(const E of u)for(const x of E.geometries)x?.dispose();e.dispose()}t.userData.isTerrainLOD=!0,t.userData.pickables=d,t.userData.boundingBox=y,t.userData.update=b,t.userData.refresh=I,t.userData.dispose=A,t.userData.stats=()=>({chunks:_,triangles:Math.round(m),levels:u.reduce((E,x)=>(E[x.level]=(E[x.level]||0)+1,E),{})});const D=QM(s);t.add(D);for(const E of u)M(E,0),M(E,1),M(E,2);return b(0,0,!0),t}const Bc={debug:10,info:20,warn:30,error:40,silent:99},ty=new URLSearchParams(location.search),ey=(ty.get("log")||"").toLowerCase();let ny=Bc[ey]??Bc.info;const Sd=800,Jr=[];function Xf(){return(performance.now()/1e3).toFixed(3)}function iy(s,t,e){Jr.push({t:Number(Xf()),level:s,scope:t,message:e}),Jr.length>Sd&&Jr.splice(0,Jr.length-Sd)}function us(s,t,e){Array.isArray(e)||(e=[e]);const i=e.map(a=>{if(a instanceof Error)return`${a.name}: ${a.message}`;if(typeof a=="object"&&a!==null)try{return JSON.stringify(a)}catch{return String(a)}return String(a)}).join(" ");if(iy(s,t,i),Bc[s]<ny)return;console[s==="debug"?"debug":s==="warn"?"warn":s==="error"?"error":"log"](`[${Xf()}s][${t}] ${i}`)}function Gs(s){return{debug:(...t)=>us("debug",s,t),info:(...t)=>us("info",s,t),warn:(...t)=>us("warn",s,t),error:(...t)=>us("error",s,t),time(t,e){const i=performance.now();try{return e()}finally{const r=performance.now()-i;us(r>16?"warn":"debug",s,[`${t} took ${r.toFixed(1)} ms`])}},async timeAsync(t,e){const i=performance.now();try{return await e()}finally{const r=performance.now()-i;us(r>16?"warn":"debug",s,[`${t} took ${r.toFixed(1)} ms`])}}}}function sy(){const s=Jr.map(t=>`${t.t.toFixed(3)}s ${t.level.toUpperCase().padEnd(5)} ${t.scope}: ${t.message}`).join(`
`);return console.log(s),s}function ry(){window.addEventListener("error",s=>{us("error","window",`${s.message} (${s.filename}:${s.lineno})`)}),window.addEventListener("unhandledrejection",s=>{us("error","promise",s.reason?.stack||s.reason||"unhandled rejection")})}class oy{constructor({onLowFps:t=null,lowFps:e=24,windowMs:i=2500}={}){this.onLowFps=t,this.lowFps=e,this.windowMs=i,this.frames=0,this.windowStart=performance.now(),this.fps=0,this.frameMs=0,this.worstMs=0,this.longFrames=0,this.lastFrame=performance.now(),this.samples=0,this.dropped=!1,this.badWindows=0,this.log=Gs("perf")}begin(t){const e=t-this.lastFrame;this.lastFrame=t,this.frameMs=this.frameMs?this.frameMs*.9+e*.1:e,e>this.worstMs&&(this.worstMs=e),e>60&&(this.longFrames++,e>250&&this.log.warn(`long frame ${e.toFixed(0)} ms`))}sample(t){this.frames++;const e=t-this.windowStart;if(e<500)return;const i=this.frames*1e3/e;this.fps=i,this.frames=0,this.windowStart=t,this.samples++,i<this.lowFps?this.badWindows++:this.badWindows=0,!this.dropped&&t>8e3&&this.badWindows>=3&&(this.dropped=!0,this.log.warn(`low frame rate: ${i.toFixed(1)} fps for ${(this.badWindows*.5).toFixed(1)} s — lowering quality`),this.onLowFps?.(i))}}const ay=Gs("stage");class ly{constructor(){this.items=[]}get size(){return this.items.length}push(t,e){const i={priority:t,value:e},r=this.items;r.push(i);let a=r.length-1;for(;a>0;){const l=a-1>>1;if(r[l].priority<=r[a].priority)break;[r[l],r[a]]=[r[a],r[l]],a=l}}pop(){const t=this.items;if(!t.length)return null;const e=t[0],i=t.pop();if(t.length){t[0]=i;let r=0;for(;;){const a=r*2+1,l=a+1;let h=r;if(a<t.length&&t[a].priority<t[h].priority&&(h=a),l<t.length&&t[l].priority<t[h].priority&&(h=l),h===r)break;[t[h],t[r]]=[t[r],t[h]],r=h}}return e.value}}class cy{constructor(t,e,{name:i="Rally stage",source:r="generated",roadWidth:a=4.2}={}){this.terrain=e,this.name=i,this.source=r,this.roadWidth=a,this.points=t,this.samples=this.prepareSamples(t),this.length=this.samples[this.samples.length-1]?.s||0,this.start=this.samples[0],this.finish=this.samples[this.samples.length-1]}prepareSamples(t){const e=[];let i=0;for(let r=0;r<t.length;r++){const a=t[r];if(r>0){const l=t[r-1];i+=Math.hypot(a.x-l.x,a.z-l.z)}e.push({x:a.x,z:a.z,y:this.terrain.sample(a.x,a.z),s:i})}return e}at(t){return this.samples[zt(t,0,this.samples.length-1)]}snapToTerrain(){let t=0;for(let e=0;e<this.samples.length;e++){const i=this.samples[e];if(e>0){const r=this.samples[e-1];t+=Math.hypot(i.x-r.x,i.z-r.z)}i.y=this.terrain.sample(i.x,i.z),i.s=t}return this.length=t,this.start=this.samples[0],this.finish=this.samples[this.samples.length-1],this}nearest(t,e){let i=1/0,r=0;const a=this.samples;for(let p=0;p<a.length;p++){const g=a[p].x-t,y=a[p].z-e,w=g*g+y*y;w<i&&(i=w,r=p)}const l=a[r],h=a[Math.min(r+1,a.length-1)],u=a[Math.max(r-1,0)];let d=h.x-u.x,m=h.z-u.z;const _=Math.hypot(d,m)||1;return d/=_,m/=_,{distance:Math.sqrt(i),index:r,progress:this.length>0?l.s/this.length:0,point:l,tangent:{x:d,z:m}}}distanceTo(t,e){return this.nearest(t,e).distance}sampleAtDistance(t){const e=zt(t,0,this.length);let i=0,r=this.samples.length-1;for(;i<r-1;){const u=i+r>>1;this.samples[u].s<e?i=u:r=u}const a=this.samples[i],l=this.samples[r],h=(e-a.s)/Math.max(1e-4,l.s-a.s);return{x:a.x+(l.x-a.x)*h,z:a.z+(l.z-a.z)*h,y:a.y+(l.y-a.y)*h,angle:Math.atan2(l.x-a.x,l.z-a.z)}}startPose(){const t=this.samples[0],e=this.samples[Math.min(4,this.samples.length-1)];return{x:t.x,z:t.z,y:this.terrain.sample(t.x,t.z),yaw:Math.atan2(e.x-t.x,e.z-t.z)}}}function hy(s,t=2){let e=s.map(i=>({x:i.x,z:i.z}));for(let i=0;i<t&&!(e.length<3);i++){const r=[e[0]];for(let a=0;a<e.length-1;a++){const l=e[a],h=e[a+1];r.push({x:l.x*.75+h.x*.25,z:l.z*.75+h.z*.25}),r.push({x:l.x*.25+h.x*.75,z:l.z*.25+h.z*.75})}r.push(e[e.length-1]),e=r}return e}function uy(s,t){if(s.length<2)return s;const e=[{x:s[0].x,z:s[0].z}];let i=0;for(let a=1;a<s.length;a++){const l=s[a-1],h=s[a],u=h.x-l.x,d=h.z-l.z,m=Math.hypot(u,d);if(m<1e-4)continue;let _=(t-i)/m;for(;_<=1;)e.push({x:l.x+u*_,z:l.z+d*_}),_+=t/m;i=(i+m)%t}const r=s[s.length-1];return Math.hypot(r.x-e[e.length-1].x,r.z-e[e.length-1].z)>1&&e.push({x:r.x,z:r.z}),e}function dy(s,t=2.5){if(s.length<3)return s;const e=t*t,i=new Uint8Array(s.length);i[0]=1,i[s.length-1]=1;const r=[[0,s.length-1]];for(;r.length;){const[a,l]=r.pop();let h=0,u=-1;const d=s[a],m=s[l],_=m.x-d.x,p=m.z-d.z,g=_*_+p*p;for(let y=a+1;y<l;y++){const w=s[y];let M;if(g===0)M=(w.x-d.x)**2+(w.z-d.z)**2;else{const v=zt(((w.x-d.x)*_+(w.z-d.z)*p)/g,0,1);M=(w.x-(d.x+_*v))**2+(w.z-(d.z+p*v))**2}M>h&&(h=M,u=y)}h>e&&u>0&&(i[u]=1,r.push([a,u],[u,l]))}return s.filter((a,l)=>i[l])}function gh(s,t,e={}){const i=e.smooth??2,r=e.spacing??4,a=e.simplify===!1?s:dy(s,e.simplifyEpsilon??2.5),l=hy(a,i),h=uy(l,r);return new cy(h,t,e)}function fy(s,t=248,e=null){const i=s.sizeX/2,r=s.sizeZ/2,a=e?e.minX:-i,l=e?e.maxX:i,h=e?e.minZ:-r,u=e?e.maxZ:r,d=l-a,m=u-h,_=Math.max(d,m)/t,p=Math.ceil(d/_)+1,g=Math.ceil(m/_)+1,y=new Float32Array(p*g),w=new Float32Array(p*g);for(let M=0;M<g;M++){const v=h+M*_;for(let b=0;b<p;b++)y[M*p+b]=s.sample(a+b*_,v)}for(let M=0;M<g;M++)for(let v=0;v<p;v++){const b=Math.max(0,v-1),I=Math.min(p-1,v+1),A=Math.max(0,M-1),D=Math.min(g-1,M+1),E=(y[M*p+I]-y[M*p+b])/((I-b)*_),x=(y[D*p+v]-y[A*p+v])/((D-A)*_);w[M*p+v]=Math.hypot(E,x)}return{cell:_,n:p,m:g,heights:y,slopes:w,minX:a,minZ:h}}function wd(s,t,e,i=55){let r={x:t,z:e,slope:s.slope(t,e),score:s.slope(t,e)};for(let a=0;a<=i;a+=4){const l=a===0?1:20;for(let h=0;h<l;h++){const u=h/l*Math.PI*2,d=t+Math.cos(u)*a,m=e+Math.sin(u)*a;if(!s.inside(d,m,20)||s.sample(d,m)<6)continue;const _=s.slope(d,m),p=_+a/Math.max(1,i)*.11;p<r.score&&(r={x:d,z:m,slope:_,score:p})}}return{x:r.x,z:r.z,slope:r.slope}}function vo(s,t,e,{name:i="Rally stage",cells:r=248,maxSlope:a=.78,window:l=null}={}){t=wd(s,t.x,t.z,65),e=wd(s,e.x,e.z,24);const h=fy(s,r,l),{cell:u,n:d,heights:m,slopes:_,minX:p,minZ:g}=h,y=(z,j)=>({i:zt(Math.round((z-p)/u),0,d-1),j:zt(Math.round((j-g)/u),0,h.m-1)}),w=(z,j)=>{for(let rt=0;rt<=40;rt++){let $=-1,st=1/0;for(let tt=-rt;tt<=rt;tt++)for(let Y=-rt;Y<=rt;Y++){if(Math.max(Math.abs(Y),Math.abs(tt))!==rt)continue;const lt=z+Y,St=j+tt;if(lt<0||St<0||lt>=d||St>=h.m)continue;const Dt=St*d+lt;if(m[Dt]<1.5||_[Dt]>a)continue;const J=Y*Y+tt*tt;J<st&&(st=J,$=Dt)}if($>=0)return $}return-1},M=y(t.x,t.z),v=y(e.x,e.z),b=w(M.i,M.j),I=w(v.i,v.j);if(b<0||I<0)throw new Error("No gentle, dry ground near one of those points. Pick a spot further from the cliff edge.");if(b===I)throw new Error("Those two points are practically the same place. Pick a finish further away.");const A=d*h.m,D=new Float32Array(A).fill(1/0),E=new Int32Array(A).fill(-1),x=new Uint8Array(A),T=new ly;D[b]=0,T.push(0,b);const H=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[-1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,-1,Math.SQRT2]];let F=0,k=!1;for(;T.size&&F++<24e4;){const z=T.pop();if(x[z])continue;if(x[z]=1,z===I){k=!0;break}const j=z%d,rt=z/d|0;for(const[$,st,tt]of H){const Y=j+$,lt=rt+st;if(Y<0||lt<0||Y>=d||lt>=h.m)continue;const St=lt*d+Y;if(x[St])continue;const Dt=m[St];if(Dt<1.5)continue;const J=_[St];if(J>a)continue;let Mt=1+J*J*13+(J>.34?9:0)+(J>.58?22:0);Dt>640&&(Mt+=4);const yt=tt*u*Mt,Wt=D[z]+yt;if(Wt<D[St]){D[St]=Wt,E[St]=z;const Rt=Y-v.i,jt=lt-v.j,we=Math.hypot(Rt,jt)*u;T.push(Wt+we,St)}}}if(!k)throw new Error("No drivable link between those points. Try two spots on gentler ground.");const G=[];let W=I;for(;W>=0;){const z=W%d,j=W/d|0;G.push({x:p+z*u,z:g+j*u}),W=E[W]}return G.reverse(),gh(G,s,{name:i,source:"generated",smooth:3,spacing:4,simplifyEpsilon:2.2,roadWidth:4.2})}const bd=["Preikestolen Climb","Fjord Rim Special","Nervevarden Pass","Hengjane Hairpins","Lysefjord Drop","Neravadalen Sprint","The Pulpit Run","Kjerag Approach"];function py(s,t=Math.random){const e=s.sizeX/2-120,i=s.sizeZ/2-120;let r=null;for(let a=0;a<34;a++){const l={x:(t()*2-1)*e,z:(t()*2-1)*i},h=s.sample(l.x,l.z);if(h<120||h>610||s.slope(l.x,l.z)>.42)continue;const u=t()*Math.PI*2,d=700+t()*750,m={x:zt(l.x+Math.cos(u)*d,-e,e),z:zt(l.z+Math.sin(u)*d,-i,i)},_=s.sample(m.x,m.z);if(!(_<80||_>620||s.slope(m.x,m.z)>.42))try{const p=vo(s,l,m,{name:bd[Math.floor(t()*bd.length)]});if(p.length>650&&p.length<4200)return p;r=p}catch{}}return r||vo(s,{x:-710,z:288},{x:104,z:-245},{name:"Preikestolen Climb"})}const Ed={driving:"https://router.project-osrm.org/route/v1/driving",foot:"https://routing.openstreetmap.de/routed-foot/route/v1/foot",cycling:"https://routing.openstreetmap.de/routed-bike/route/v1/bike"};function Zf(s,t){const i=(t.lat-s.lat)*Math.PI/180,r=(t.lon-s.lon)*Math.PI/180,a=s.lat*Math.PI/180,l=t.lat*Math.PI/180,h=Math.sin(i/2)**2+Math.cos(a)*Math.cos(l)*Math.sin(r/2)**2;return 2*6371e3*Math.asin(Math.min(1,Math.sqrt(h)))}async function Na({a:s,b:t,profile:e="driving"}){const r=`${Ed[e]||Ed.driving}/${s.lon},${s.lat};${t.lon},${t.lat}?overview=full&geometries=geojson&steps=false`;let a;const l=new AbortController,h=setTimeout(()=>l.abort(),12e3);try{a=await fetch(r,{signal:l.signal})}catch(M){throw M.name==="AbortError"?new Error("OSRM took too long to answer. Use OFF-ROAD ROUTE, or try again."):new Error("OSRM could not be reached. Check the connection, or use OFF-ROAD ROUTE.")}finally{clearTimeout(h)}if(!a.ok)throw new Error(`OSRM did not answer (HTTP ${a.status}).`);const u=await a.json();if(u.code!=="Ok"||!u.routes?.length)throw new Error(u.message||"OSRM found no route between those coordinates.");const d=u.routes[0],m=u.waypoints?.[0]?.distance??null,_=u.waypoints?.[1]?.distance??null,p=m!=null&&_!=null?` Snapped ${Math.round(m)} m / ${Math.round(_)} m from the picked points.`:"",g=Zf(s,t);if(d.distance<25||g>80&&d.distance<g*.35)throw new Error(`OSRM snapped both points to the same road or trail (${Math.round(d.distance)} m route for a ${Math.round(g)} m gap).${p} Pick points on a mapped road/trail, or use OFF-ROAD ROUTE.`);const y=e==="driving"?400:750;if(m!=null&&m>y||_!=null&&_>y)throw new Error(`OSRM snapped a point ${Math.round(Math.max(m??0,_??0))} m away from where you picked, too far to make a fair stage.${p} Pick points nearer to a mapped road/trail, or use OFF-ROAD ROUTE.`);const w=d.geometry.coordinates.map(([M,v])=>({lat:v,lon:M}));if(w.length<2)throw new Error("OSRM returned an empty geometry.");return{coordinates:w,distance:d.distance,duration:d.duration,profile:e,snapped:{a:m,b:_},snapText:p}}const Td=3e4,my=4e3;function _y(s,t,e){return{lat:s.lat+(t.lat-s.lat)*e,lon:s.lon+(t.lon-s.lon)*e}}async function Va({a:s,b:t,profile:e="driving",onProgress:i=null,segmentLength:r=my}={}){const a=Zf(s,t),l=Math.max(1,Math.ceil(a/r));if(l<=1){const y=await Na({a:s,b:t,profile:e});return i?.(1,"Route received."),y}const h=[];for(let y=0;y<=l;y++)h.push(_y(s,t,y/l));const u=[];let d=0,m=0,_={a:null,b:null};const p=performance.now();for(let y=0;y<l;y++){i?.(y/l,`OSRM segment ${y+1} of ${l}…`);const w=await Na({a:h[y],b:h[y+1],profile:e}),M=u.length?1:0;for(let v=M;v<w.coordinates.length;v++)u.push(w.coordinates[v]);d+=w.distance,m+=w.duration,y===0&&(_.a=w.snapped?.a??null),_.b=w.snapped?.b??null}if(i?.(1,`Merged ${l} segments.`),u.length<2)throw new Error("The segmented route came back empty.");const g=(d/1e3).toFixed(1);if(d>Td)throw new Error(`That route is ${g} km long. The streamer covers stages up to ${Math.round(Td/1e3)} km — pick closer points.`);return ay.debug(`segmented OSRM route: ${l} hops, ${g} km in ${(performance.now()-p).toFixed(0)} ms`),{coordinates:u,distance:d,duration:m,profile:e,snapped:_,snapText:"",segmented:{hops:l,segmentLength:r}}}function Ad(s,t=48){const e=new Map,i=(r,a)=>`${r},${a}`;return s.samples.forEach((r,a)=>{const l=Math.floor(r.x/t),h=Math.floor(r.z/t),u=i(l,h);let d=e.get(u);d||e.set(u,d=[]),d.push(a)}),{cell:t,distanceTo(r,a,l=40){const h=Math.floor(r/t),u=Math.floor(a/t),d=Math.ceil(l/t);let m=1/0;for(let _=-d;_<=d;_++)for(let p=-d;p<=d;p++){const g=e.get(i(h+p,u+_));if(g)for(const y of g){const w=s.samples[y],M=Math.hypot(w.x-r,w.z-a);M<m&&(m=M)}}return m===1/0?l+t:m}}}function vh(s,t,{requireInside:e=!0}={}){const{coordinates:i,profile:r,snapText:a="",snapped:l={}}=t,h=[];let u=0;for(const{lat:m,lon:_}of i){const p=s.worldFromLatLon(m,_);e&&!s.inside(p.x,p.z,4)&&u++,h.push(p)}if(u>0)throw new Error(`That road leaves the ${(s.sizeX/1e3).toFixed(0)} km terrain (${u} of ${h.length} points outside). Generate a world for it from the 2D map.`);if(h.length<2)throw new Error("OSRM returned an empty geometry.");const d=gh(h,s,{name:`${r==="foot"?"Footpath":r==="cycling"?"Bike trail":"OSRM road"} stage`,source:"osrm",smooth:1,spacing:5,simplifyEpsilon:2,roadWidth:r==="driving"?4.8:3.4});if(d.length<20)throw new Error(`That road is too short to make a stage (${Math.round(d.length)} m).${a}`);return{route:d,distance:t.distance,duration:t.duration,profile:r,snapped:l}}function gy(s,t="#f2c14e"){const e=document.createElement("canvas");e.width=1024,e.height=192;const i=e.getContext("2d");i.fillStyle="rgba(18,22,20,0.92)",i.fillRect(0,0,e.width,e.height),i.strokeStyle=t,i.lineWidth=10,i.strokeRect(8,8,e.width-16,e.height-16),i.fillStyle=t,i.font='bold 112px "Arial Black", Impact, sans-serif',i.textAlign="center",i.textBaseline="middle",i.fillText(s,e.width/2,e.height/2+6);const r=new za(e);return r.colorSpace=Cn,r}function vy(){const s=document.createElement("canvas");s.width=128,s.height=32;const t=s.getContext("2d");for(let i=0;i<4;i++)for(let r=0;r<16;r++)t.fillStyle=(r+i)%2?"#131716":"#e8e7db",t.fillRect(r*8,i*8,8,8);const e=new za(s);return e.colorSpace=Cn,e.magFilter=rn,e}function Rd(s,t,e){const i=e?Math.min(3,s.samples.length-1):Math.max(0,s.samples.length-1),r=s.samples[i],a=e?s.samples[Math.min(i+3,s.samples.length-1)]:s.samples[Math.max(0,i-3)],l=Math.atan2(a.x-r.x,a.z-r.z),h=new hn;h.position.set(r.x,t.sample(r.x,r.z)+.1,r.z),h.rotation.y=l;const u=s.roadWidth*2+2.6,d=new qe({color:e?3116891:13193021}),m=new ni(.22,.28,5.4,6);for(const v of[-u/2,u/2]){const b=new pe(m,d);b.position.set(v,2.7,0),b.castShadow=!0,h.add(b)}const _=new pe(new Un(u+.7,.45,.5),new qe({color:e?3116891:13193021}));_.position.y=5.25,_.castShadow=!0,h.add(_);const p=gy(e?"START":"FINISH",e?"#7fe6a8":"#ffd75e"),g=new ii(u*.86,1.55),y=new pe(g,new Hn({map:p,side:es,toneMapped:!1}));y.position.set(0,4.35,.03);const w=new pe(g,new Hn({map:p,side:es,toneMapped:!1}));w.position.set(0,4.35,-.03),w.rotation.y=Math.PI,h.add(y,w);const M=new pe(new ii(u,2.8),new Hn({map:vy(),side:$n,toneMapped:!1,polygonOffset:!0,polygonOffsetFactor:-4}));return M.rotation.x=-Math.PI/2,M.position.y=.3,h.add(M),h.userData.line=M,h}function qf(s,t,{bounds:e=null,gates:i="both",posts:r=!0}={}){const a=s.samples,l=p=>!e||p.x>=e.minX&&p.x<=e.maxX&&p.z>=e.minZ&&p.z<=e.maxZ,h=[];let u=null;for(let p=0;p<a.length;p++){if(!l(a[p])){u=null;continue}u&&p===u.end+1?u.end=p:(u={start:p,end:p},h.push(u))}const d=new hn;d.name="road";for(const{start:p,end:g}of h)g-p<1||d.add(xy(s,t,p,g));r&&d.add(My(s,t,l));const m=(i==="both"||i==="start")&&l(a[0]),_=(i==="both"||i==="finish")&&l(a[a.length-1]);return m&&d.add(Rd(s,t,!0)),_&&d.add(Rd(s,t,!1)),d}function xy(s,t,e,i){const r=s.samples,a=i-e+1,l=s.roadWidth,h=.9,u=6,d=new Float32Array(a*u*3),m=new Float32Array(a*u*3),_=[],p=new Qt(8222569),g=new Qt(6446418),y=new Qt(5067078),w=new Qt(9406583),M=new Qt(3357237),v=new Qt,b=Math.max(.5,l*1.15);for(let E=0;E<a;E++){const x=e+E,T=r[x],H=r[Math.max(e,x-1)],F=r[Math.min(i,x+1)];let k=F.x-H.x,G=F.z-H.z;const W=Math.hypot(k,G)||1;k/=W,G/=W;const z=-G,j=k,rt=E<3||E>a-4?1:.55,$=t.sample(T.x,T.z),st=.16;for(let tt=0;tt<u;tt++){const Y=tt<=2?-(tt===0||tt===1?l+h:l):tt===3?l:l+h,lt=T.x+z*Y,St=T.z+j*Y;let Dt=t.sample(lt,St);(tt===0||tt===1||tt===4||tt===5)&&(Dt=$+zt(Dt-$,-b,b));const J=tt===2||tt===3?.06:0,Mt=tt===0||tt===5?.55:0,yt=(E*u+tt)*3;d[yt]=lt,d[yt+1]=Dt+st+J-Mt,d[yt+2]=St,tt===0||tt===5?v.copy(M):tt===1||tt===4?v.copy(y):E%17===0?v.copy(w):v.copy(E%5===0?g:p),v.multiplyScalar(.92+rt*.08),m[yt]=v.r,m[yt+1]=v.g,m[yt+2]=v.b}if(E<a-1){const tt=E*u,Y=(E+1)*u;for(let lt=0;lt<u-1;lt++)_.push(tt+lt,Y+lt,tt+lt+1),_.push(tt+lt+1,Y+lt,Y+lt+1)}}const I=new yn;I.setAttribute("position",new xn(d,3)),I.setAttribute("color",new xn(m,3)),I.setIndex(_),I.computeVertexNormals();const A=new qe({vertexColors:!0,flatShading:!0,side:$n,polygonOffset:!0,polygonOffsetFactor:-3,polygonOffsetUnits:-3}),D=new pe(I,A);return D.receiveShadow=!0,D.castShadow=!1,D.name="roadRibbon",D}function My(s,t,e){const i=s.roadWidth,r=new ni(.065,.085,1.15,5),a=new Hn({color:16052193}),l=new Hn({color:13581874}),h=[],u=26;for(let g=18;g<s.length-12;g+=u){const y=s.sampleAtDistance(g);if(!e(y))continue;const w=s.sampleAtDistance(g-3),M=s.sampleAtDistance(g+3),v=M.x-w.x,b=M.z-w.z,I=Math.hypot(v,b)||1,A=-b/I,D=v/I,E=Math.round(g/u)%2?1:-1,x=y.x+A*(i+1.2)*E,T=y.z+D*(i+1.2)*E;h.push({x,z:T,y:t.sample(x,T)+.55,red:E>0})}const d=h.filter(g=>!g.red),m=h.filter(g=>g.red),_=(g,y)=>{const w=new ji(r,y,Math.max(1,g.length)),M=new Ae;return g.forEach((v,b)=>{M.makeTranslation(v.x,v.y,v.z),w.setMatrixAt(b,M)}),w.count=g.length,w.instanceMatrix.needsUpdate=!0,w},p=new hn;return p.name="roadPosts",p.add(_(d,a),_(m,l)),p}const ua=1.58,qr=.38,Pd=1180,yy=19.6,Sy=14,wy=8,Vl=[-3.4,3.55,2.35,1.72,1.32,1.04,.84],da=0,by=3.9,Ds=900,$f=6800,Ey=285,Ty=6100,Ay=1950,Ry=.28,Cd={road:{mu:1.02,rolling:.55,drag:.0018},gravel:{mu:.76,rolling:2.2,drag:.0042}};function Py(s){const t=document.createElement("canvas");t.width=128,t.height=128;const e=t.getContext("2d");e.fillStyle="#f1ead8",e.fillRect(0,0,128,128),e.strokeStyle="#1b1e1c",e.lineWidth=6,e.strokeRect(3,3,122,122),e.fillStyle="#1b1e1c",e.font='bold 88px "Arial Black", Impact, sans-serif',e.textAlign="center",e.textBaseline="middle",e.fillText(s,64,70);const i=new za(t);return i.colorSpace=Cn,i}function Cy(s){const t=zt((s-Ds)/($f-Ds),0,1),e=Math.sin(Math.PI*Math.pow(t,.9))*.55+.55;return Ey*zt(e,.25,1)}class Yf{constructor(t,e){this.scene=t,this.terrain=e,this.route=null,this.roadQuery=null,this.pos=new nt(0,0,0),this.vel=new le(0,0),this.yaw=0,this.yawVel=0,this.verticalVel=0,this.bounce=0,this.bounceVel=0,this.grounded=!0,this.steer=0,this.steerVisual=0,this.vF=0,this.vR=0,this.speed=0,this.onRoad=!1,this.drifting=!1,this.airTime=0,this.landingImpact=0,this.distance=0,this.wrongWay=!1,this.pitch=0,this.roll=0,this.bodyRoll=0,this.bodyPitch=0,this.wheelSpin=0,this.wheelCompression=[0,0,0,0],this.gear=1,this.autoShift=!0,this.rpm=Ds,this.shiftTimer=0,this.engineLoad=0,this.airborneAt=-1,this.airControl=0,this.group=new hn,this.group.name="car",this.buildModel(),t.add(this.group),this.dust=this.createDust(),t.add(this.dust.points)}buildModel(){const t=this.group,e=new qe({color:13847089,flatShading:!0}),i=new qe({color:10366754,flatShading:!0}),r=new qe({color:15985368,flatShading:!0}),a=new qe({color:1912633,flatShading:!0}),l=new qe({color:1514009,flatShading:!0}),h=new qe({color:14144195,flatShading:!0}),u=new Hn({color:16771496,toneMapped:!1}),d=new Hn({color:16726570,toneMapped:!1}),m=new pe(new Un(1.74,.48,4),e);m.position.y=.68,m.castShadow=!0,m.receiveShadow=!0,t.add(m);const _=new pe(new Un(1.68,.34,.55),i);_.position.set(0,.58,2.06),_.castShadow=!0,t.add(_);const p=new pe(new Un(1.48,.58,1.85),a);p.position.set(0,1.14,-.18),p.castShadow=!0,t.add(p);const g=new pe(new Un(1.42,.14,1.55),r);g.position.set(0,1.47,-.23),g.castShadow=!0,t.add(g);const y=new pe(new ii(.72,.72),new Hn({map:Py("37"),toneMapped:!1}));y.rotation.x=-Math.PI/2,y.position.set(.28,1.545,-.22),t.add(y);for(const k of[-.72,.72]){const G=new pe(new Un(.34,.2,.06),u);G.position.set(k,.7,2.02+.02),t.add(G);const W=new pe(new Un(.28,.18,.06),d);W.position.set(k,.72,-2.02),t.add(W)}const w=new pe(new Un(1.78,.15,.18),l);w.position.set(0,.42,2.1),t.add(w);const M=w.clone();M.position.z=-2.1,t.add(M);const v=new pe(new Un(.38,.03,4.02),r);v.position.set(0,.94,0),t.add(v);const b=new pe(new ni(.06,.06,.32,6),h);b.rotation.x=Math.PI/2,b.position.set(-.55,.34,-2.1),t.add(b),this.wheels=[];const I=new ni(qr,qr,.3,10);I.rotateZ(Math.PI/2);const A=new ni(.19,.19,.32,8);A.rotateZ(Math.PI/2);const D=[[-ua/2,.38,1.34,!0],[ua/2,.38,1.34,!0],[-ua/2,.38,-1.32,!1],[ua/2,.38,-1.32,!1]];for(const[k,G,W,z]of D){const j=new hn;j.position.set(k,G,W);const rt=new hn,$=new pe(I,l);$.castShadow=!0;const st=new pe(A,h);rt.add($,st),j.add(rt),t.add(j),this.wheels.push({pivot:j,spin:rt,front:z,x:k,z:W})}const E=document.createElement("canvas");E.width=128,E.height=128;const x=E.getContext("2d"),T=x.createRadialGradient(64,64,8,64,64,62);T.addColorStop(0,"rgba(0,0,0,0.55)"),T.addColorStop(1,"rgba(0,0,0,0)"),x.fillStyle=T,x.fillRect(0,0,128,128);const H=new za(E),F=new pe(new ii(3.2,4.6),new Hn({map:H,transparent:!0,depthWrite:!1}));F.rotation.x=-Math.PI/2,F.position.y=.02,t.add(F),this.blobShadow=F}createDust(){const e=new yn,i=new Float32Array(270);i.fill(-9999),e.setAttribute("position",new xn(i,3));const r=new Sf({color:13616033,size:.7,sizeAttenuation:!0,transparent:!0,opacity:.5,depthWrite:!1}),a=new b_(e,r);return a.frustumCulled=!1,{points:a,count:90,positions:i,particles:Array.from({length:90},()=>({life:0,maxLife:1,x:0,y:0,z:0,vx:0,vy:0,vz:0})),next:0,clock:0}}setRoute(t){if(this.route=t,t){const e=t.startPose();this.reset(e)}}reset(t){t||(t=this.route?this.route.startPose():{x:0,z:0,yaw:0}),this.pos.set(t.x,this.terrain.sample(t.x,t.z),t.z),this.vel.set(0,0),this.yaw=t.yaw||0,this.yawVel=0,this.verticalVel=0,this.bounce=0,this.bounceVel=0,this.grounded=!0,this.steer=0,this.steerVisual=0,this.speed=0,this.vF=0,this.vR=0,this.pitch=0,this.roll=0,this.bodyRoll=0,this.bodyPitch=0,this.airTime=0,this.landingImpact=0,this.distance=0,this.wrongWay=!1,this.gear=1,this.rpm=Ds,this.shiftTimer=0,this.airborneAt=-1,this.group.position.copy(this.pos),this.group.quaternion.identity(),this.group.rotateY(this.yaw);for(const e of this.dust.particles)e.life=0;this.dust.positions.fill(-9999),this.dust.points.geometry.attributes.position.needsUpdate=!0}forward(){return{x:Math.sin(this.yaw),z:Math.cos(this.yaw)}}right(){return{x:Math.cos(this.yaw),z:-Math.sin(this.yaw)}}gearRatio(){return Vl[Math.max(0,this.gear)]??1}shift(t){const e=zt(t,0,Vl.length-1);e!==this.gear&&(this.gear=e,this.shiftTimer=Ry)}updateDrivetrain(t,e,i){const r=zt(e.throttle||0,0,1),a=zt(e.brake||0,0,1),l=this.gear===da,h=Math.abs(this.vF),u=h/(2*Math.PI*qr)*60,d=Math.abs(this.gearRatio())*by,m=zt(u*d,Ds,$f),_=l?a:r,p=_>0&&h<1?1:0;this.rpm=Fn(this.rpm,Math.max(m,Ds+p*900),9,t),this.shiftTimer=Math.max(0,this.shiftTimer-t),this.gear===da?r>.1&&this.vF>-.5&&this.shift(1):a>.5&&this.vF<.4&&Math.abs(this.vF)<1.4&&this.shift(da),this.autoShift&&this.shiftTimer<=0?this.gear!==da&&(this.rpm>Ty&&r>.25&&this.gear<Vl.length-1?this.shift(this.gear+1):this.rpm<Ay&&this.gear>1&&this.shift(this.gear-1)):this.autoShift||(e.shiftUp&&this.shift(this.gear+1),e.shiftDown&&this.gear>1&&this.shift(this.gear-1));const g=this.shiftTimer>.12,w=Cy(this.rpm)*_*(g?.15:1)*(this.grounded?1:.35)*d/qr*(l?-1:1),M=_===0&&Math.abs(this.vF)>1?-(Math.sign(this.vF)*(28+this.rpm*.012)*Math.abs(d)*.16):0;return this.engineLoad=_,{driveForce:w,engineBrake:M,brake:l?r:a,throttle:_,surface:i}}update(t,e){if(this.steer=Fn(this.steer,e.steer||0,12,t),this.forward(),this.right(),this.route?(this.roadQuery=this.route.nearest(this.pos.x,this.pos.z),this.onRoad=this.roadQuery.distance<=this.route.roadWidth+1,this.progress=this.roadQuery.progress):(this.roadQuery=null,this.onRoad=!1,this.progress=0),e.frozen)return this.vel.set(0,0),this.vF=0,this.vR=0,this.speed=0,this.yawVel=0,this.verticalVel=0,this.bounce=0,this.bounceVel=0,this.grounded=!0,this.pos.y=this.terrain.sample(this.pos.x,this.pos.z),this.updateVisual(t,0),this.updateDust(t,0,0),{speed:0,vF:0,vR:0,rpm:Ds,gear:1,onRoad:this.onRoad,drifting:!1,grounded:!0,progress:this.progress||0,wrongWay:!1,landingImpact:0};const i=zt(Math.ceil(t/(1/120)),1,wy),r=t/i,a=this.onRoad?Cd.road:Cd.gravel,l=this.updateDrivetrain(t,e,a);let h=!1;for(let d=0;d<i;d++)this.simulateStep(r,e,l,a,{jump:e.jump&&!h}),e.jump&&(h=!0);const u=Math.hypot(this.vF,this.vR);if(this.speed=u,this.distance+=Math.abs(this.vF)*t,this.airTime=this.grounded?Math.max(0,this.airTime-t*3):this.airTime+t,this.roadQuery&&u>4){const d=this.roadQuery,m=(this.vel.x*d.tangent.x+this.vel.y*d.tangent.z)/Math.max(.001,u);this.wrongWay=m<-.35}else this.wrongWay=!1;return this.updateVisual(t,u),this.updateDust(t,u,l.throttle),{speed:u,vF:this.vF,vR:this.vR,rpm:this.rpm,gear:this.gear,onRoad:this.onRoad,drifting:this.drifting,grounded:this.grounded,progress:this.progress||0,wrongWay:this.wrongWay,landingImpact:this.landingImpact}}simulateStep(t,e,i,r,{jump:a}){const l=this.forward(),h=this.right();let u=this.vF,d=this.vR;if(this.grounded){u+=i.driveForce/Pd*t,i.brake>0&&(u-=Math.sign(u)*Math.min(Math.abs(u)/t,21*i.brake)*t),e.handbrake&&(u-=Math.sign(u)*Math.min(Math.abs(u)/t,5)*t),u+=i.engineBrake/Pd*t,u-=Math.sign(u)*r.rolling*t,u-=u*Math.abs(u)*r.drag*t,u-=u*(this.onRoad?.08:.22)*t,i.throttle===0&&i.brake===0&&Math.abs(u)<3.5&&(u*=Math.exp(-4.5*t));const{gx:w,gz:M}=this.terrain.gradient(this.pos.x,this.pos.z,6),v=1+w*w+M*M;u+=-9.81*(w*l.x+M*l.z)/v*t,d+=-9.81*(w*h.x+M*h.z)/v*t*.55;const b=Math.atan2(Math.abs(d),Math.max(1.2,Math.abs(u))),I=Math.sin(1.55*Math.atan(9*b)),A=e.handbrake?.38:1,E=r.mu*A*9.81*1.15,x=-Math.sign(d)*E*zt(I,0,1)*zt(Math.abs(d)/.35,0,1);d+=x*t,!this.onRoad&&Math.abs(u)>4&&(d+=(Math.random()-.5)*2.4*t);const H=this.steer*zt(2.95-Math.abs(u)*.032,1.15,2.95)*Math.sign(u||1)*zt(Math.abs(u)/2.6,0,1),F=e.handbrake?4:9.5;if(this.yawVel=Fn(this.yawVel,H,F,t),e.handbrake&&Math.abs(u)>6&&(this.yawVel+=this.steer*1.5*zt(Math.abs(u)/20,0,1)*t),this.drifting=Math.abs(d)>3.2&&Math.hypot(u,d)>7,a&&this.airTime<.15){const k=this.terrain.sample(this.pos.x,this.pos.z);this.pos.y=k+.22,this.bounce=.22,this.bounceVel=0,this.verticalVel=6.2,this.grounded=!1,this.airTime=0,this.airborneAt=0}}else this.drifting=!1,this.yawVel=Fn(this.yawVel,this.yawVel*.985,.3,t),u-=u*.035*t,this.airControl=Fn(this.airControl,this.steer*.55,2,t),this.yawVel+=this.airControl*t;this.yaw=BM(this.yaw+this.yawVel*t);const m=this.forward(),_=this.right();this.vel.set(m.x*u+_.x*d,m.z*u+_.z*d);const p=this.pos.x+this.vel.x*t,g=this.pos.z+this.vel.y*t;this.terrain.inside(p,g,3)?(this.pos.x=p,this.pos.z=g):(this.vel.multiplyScalar(.2),u*=.2,d*=.2);const y=this.terrain.sample(this.pos.x,this.pos.z);if(this.pos.y<y-.9&&(this.pos.y=y,this.bounce=0,this.bounceVel=Math.max(0,this.bounceVel),this.verticalVel=0,this.grounded=!0),this.grounded)this.bounceVel+=(-190*this.bounce-Sy*this.bounceVel)*t,this.bounce=zt(this.bounce+this.bounceVel*t,-.55,.45),this.pos.y=y+this.bounce,this.pos.y<y-.22&&(this.pos.y=y-.22,this.bounceVel=Math.max(0,this.bounceVel)),this.sampleWheels(y)===0&&this.pos.y>y+.5&&(this.grounded=!1,this.airborneAt=0,this.verticalVel=Math.max(.6,this.verticalVel));else if(this.verticalVel-=yy*t,this.pos.y+=this.verticalVel*t,this.airborneAt>=0&&(this.airborneAt+=t),this.pos.y<=y){const w=-this.verticalVel;this.landingImpact=zt(w/12,0,1),this.pos.y=y,this.bounce=-zt(w*.02,0,.28),this.bounceVel=-zt(w*.12,0,2.4),this.verticalVel=0,this.grounded=!0,this.airborneAt=-1}this.vF=u,this.vR=d}sampleWheels(t){const e=this.forward(),i=this.right();let r=0;for(let a=0;a<this.wheels.length;a++){const l=this.wheels[a],h=this.pos.x+e.x*l.z+i.x*l.x,u=this.pos.z+e.z*l.z+i.z*l.x,d=this.terrain.sample(h,u),m=t-d;this.wheelCompression[a]=zt(m*1.6,-.22,.3),d<this.pos.y+.55&&r++}return r}updateVisual(t,e){const i=this.forward(),r=this.right(),a=3.2,l=this.terrain.sample(this.pos.x+i.x*1.4,this.pos.z+i.z*1.4),h=this.terrain.sample(this.pos.x-i.x*1.4,this.pos.z-i.z*1.4),u=this.terrain.sample(this.pos.x+r.x*.85,this.pos.z+r.z*.85),d=this.terrain.sample(this.pos.x-r.x*.85,this.pos.z-r.z*.85);let m,_;this.grounded?(m=Math.atan2(h-l,a),_=Math.atan2(u-d,a*.54),m=zt(m,-.55,.55),_=zt(_,-.4,.4)):(m=zt(-this.verticalVel*.035,-.4,.4),_=this.roll*.98),this.pitch=Fn(this.pitch,m,this.grounded?10:2,t),this.roll=Fn(this.roll,_,this.grounded?9:2,t);const p=this.yawVel*this.vF,g=(this.vF-(this.prevVF??this.vF))/Math.max(t,1e-4);this.prevVF=this.vF,this.bodyRoll=Fn(this.bodyRoll,zt(-p*.01,-.16,.16),7,t),this.bodyPitch=Fn(this.bodyPitch,zt(-g*.006,-.09,.09)+this.bounce*.35,7,t),this.group.position.copy(this.pos),this.group.position.y+=.02+this.bounce*.25;const y=new Kn().setFromAxisAngle(new nt(0,1,0),this.yaw),w=new Kn().setFromAxisAngle(new nt(1,0,0),this.pitch+this.bodyPitch),M=new Kn().setFromAxisAngle(new nt(0,0,1),this.roll+this.bodyRoll);this.group.quaternion.copy(y).multiply(w).multiply(M),this.steerVisual=Fn(this.steerVisual,this.steer*.48,12,t),this.wheelSpin+=this.vF/qr*t;for(const v of this.wheels)v.spin.rotation.x=this.wheelSpin,v.front&&(v.pivot.rotation.y=this.steerVisual);this.blobShadow.material.opacity=zt(1-this.airTime*1.4,0,1)}updateDust(t,e,i){const r=this.dust;if(r.clock+=t,this.grounded&&e>5&&(!this.onRoad||this.drifting||i>.9)&&r.clock>.035){r.clock=0;const l=this.forward(),h=this.right();for(const u of[-1,1]){const d=r.particles[r.next];r.next=(r.next+1)%r.count,d.life=d.maxLife=.65+Math.random()*.55,d.x=this.pos.x-l.x*1.5+h.x*u*.8,d.z=this.pos.z-l.z*1.5+h.z*u*.8,d.y=this.pos.y+.12,d.vx=-this.vel.x*.16+(Math.random()-.5)*.7,d.vz=-this.vel.y*.16+(Math.random()-.5)*.7,d.vy=.7+Math.random()*1.2}}for(let l=0;l<r.count;l++){const h=r.particles[l];if(h.life<=0)continue;if(h.life-=t,h.life<=0){r.positions[l*3+1]=-9999;continue}h.x+=h.vx*t,h.y+=h.vy*t,h.z+=h.vz*t,h.vy+=1*t;const u=h.life/h.maxLife;r.positions[l*3]=h.x,r.positions[l*3+1]=h.y,r.positions[l*3+2]=h.z,u<.02&&(r.positions[l*3+1]=-9999)}r.points.geometry.attributes.position.needsUpdate=!0}}class Ly{constructor(t){this.renderer=t,this.pixelScaleOverride=null,this.target=new vi(640,360,{minFilter:rn,magFilter:rn,depthBuffer:!0,stencilBuffer:!1}),this.target.texture.generateMipmaps=!1,this.postScene=new vf,this.postCamera=new mh(-1,1,1,-1,0,1),this.material=new Ii({depthTest:!1,depthWrite:!1,uniforms:{tDiffuse:{value:this.target.texture},uResolution:{value:new le(640,360)},uScreen:{value:new le(1280,720)},uTime:{value:0}},vertexShader:`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,fragmentShader:`
        uniform sampler2D tDiffuse;
        uniform vec2 uResolution;
        uniform vec2 uScreen;
        uniform float uTime;
        varying vec2 vUv;

        float bayer4(vec2 p) {
          int x = int(mod(p.x, 4.0));
          int y = int(mod(p.y, 4.0));
          float m[16];
          m[0] = 0.0;  m[1] = 8.0;  m[2] = 2.0;  m[3] = 10.0;
          m[4] = 12.0; m[5] = 4.0;  m[6] = 14.0; m[7] = 6.0;
          m[8] = 3.0;  m[9] = 11.0; m[10] = 1.0; m[11] = 9.0;
          m[12] = 15.0;m[13] = 7.0; m[14] = 13.0;m[15] = 5.0;
          int i = x + y * 4;
          return m[i] / 16.0 - 0.5;
        }

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 d = (vUv - 0.5) * 0.0018;
          float r = texture2D(tDiffuse, vUv + d).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - d).b;
          vec3 col = vec3(r, g, b);

          // Slightly warm, slightly contrasty.
          col = pow(max(col, 0.0), vec3(0.96));
          col = (col - 0.5) * 1.065 + 0.5;
          col *= vec3(1.035, 1.0, 0.955);

          float dither = bayer4(gl_FragCoord.xy) * 0.045;
          col += dither;
          float levels = 26.0;
          col = floor(col * levels + 0.5) / levels;

          float scan = 0.955 + 0.045 * sin(vUv.y * uScreen.y * 3.14159265);
          col *= scan;

          vec2 vig = vUv * (1.0 - vUv);
          float v = smoothstep(0.0, 0.24, vig.x) * smoothstep(0.0, 0.20, vig.y);
          col *= mix(0.72, 1.0, v);

          float grain = hash(gl_FragCoord.xy + uTime * 60.0) - 0.5;
          col += grain * 0.012;

          gl_FragColor = vec4(max(col, 0.0), 1.0);
        }
      `}),this.quad=new pe(new ii(2,2),this.material),this.quad.frustumCulled=!1,this.postScene.add(this.quad)}resize(t,e){this.lastWidth=t,this.lastHeight=e;const i=this.pixelScaleOverride??(t<700?.6:.46),r=Math.max(420,Math.min(1024,Math.round(t*i))),a=Math.max(260,Math.round(r*(e/t)));this.target.setSize(r,a),this.material.uniforms.uResolution.value.set(r,a),this.material.uniforms.uScreen.value.set(t,e),this.postCamera.updateProjectionMatrix()}setPixelScale(t){this.pixelScaleOverride=t,this.lastWidth&&this.resize(this.lastWidth,this.lastHeight)}render(t,e,i){const r=this.renderer;this.material.uniforms.uTime.value=i,r.setRenderTarget(this.target),r.clear(),r.render(t,e),r.setRenderTarget(null),r.render(this.postScene,this.postCamera)}}class Iy{constructor(){this.ctx=null,this.ready=!1,this.muted=!1,this.started=!1}init(){if(this.ctx)return;const t=window.AudioContext||window.webkitAudioContext;if(!t)return;this.ctx=new t;const e=this.ctx;this.master=e.createGain(),this.master.gain.value=.55,this.master.connect(e.destination),this.engineGain=e.createGain(),this.engineGain.gain.value=0,this.engineFilter=e.createBiquadFilter(),this.engineFilter.type="lowpass",this.engineFilter.frequency.value=900,this.engineFilter.Q.value=1.4,this.engineGain.connect(this.engineFilter).connect(this.master),this.osc1=e.createOscillator(),this.osc1.type="sawtooth",this.osc1.frequency.value=60,this.osc2=e.createOscillator(),this.osc2.type="square",this.osc2.frequency.value=30;const i=e.createGain();i.gain.value=.35,this.osc1.connect(this.engineGain),this.osc2.connect(i).connect(this.engineGain),this.osc1.start(),this.osc2.start();const a=e.createBuffer(1,e.sampleRate*2,e.sampleRate),l=a.getChannelData(0);let h=0;for(let d=0;d<l.length;d++){const m=Math.random()*2-1;h=h*.72+m*.28,l[d]=h}this.noiseBuffer=a;const u=(d,m,_,p)=>{const g=e.createBufferSource();g.buffer=a,g.loop=!0;const y=e.createBiquadFilter();y.type=d,y.frequency.value=m,y.Q.value=_;const w=e.createGain();return w.gain.value=p,g.connect(y).connect(w).connect(this.master),g.start(),{src:g,filter:y,gain:w}};this.wind=u("bandpass",900,.6,0),this.gravel=u("lowpass",340,1.2,0),this.skid=u("bandpass",1500,3.5,0),this.ready=!0}async start(){this.ctx||this.init(),this.ctx&&(this.ctx.state==="suspended"&&await this.ctx.resume(),this.started=!0)}setMuted(t){this.muted=t,this.master&&this.master.gain.setTargetAtTime(t?0:.55,this.ctx.currentTime,.05)}update(t){if(!this.ready||!this.started)return;const e=this.ctx.currentTime,i=t.speed||0,r=t.throttle||0,a=t.onRoad,l=t.drifting,h=t.running,u=13,d=Math.min(5,Math.floor(i/u)),m=(i-d*u)/u,_=h?.22+m*.72+r*.18:0,p=42+d*7+_*92;this.osc1.frequency.setTargetAtTime(p,e,.035),this.osc2.frequency.setTargetAtTime(p*.5,e,.035),this.engineFilter.frequency.setTargetAtTime(500+r*900+i*12,e,.06),this.engineGain.gain.setTargetAtTime(h?.1+r*.12+i*.0015:0,e,.08),this.wind.gain.gain.setTargetAtTime(Math.min(.14,i*.0028),e,.12),this.wind.filter.frequency.setTargetAtTime(700+i*22,e,.15),this.gravel.gain.gain.setTargetAtTime(h&&!a?Math.min(.11,i*.0032):0,e,.09),this.skid.gain.gain.setTargetAtTime(h&&l?Math.min(.1,i*.0025):0,e,.05)}}function Dy(s){return s&&s.__esModule&&Object.prototype.hasOwnProperty.call(s,"default")?s.default:s}var Qr={exports:{}};var Ny=Qr.exports,Ld;function Fy(){return Ld||(Ld=1,(function(s,t){(function(e,i){i(t)})(Ny,(function(e){var i="1.9.4";function r(n){var o,c,f,S;for(c=1,f=arguments.length;c<f;c++){S=arguments[c];for(o in S)n[o]=S[o]}return n}var a=Object.create||(function(){function n(){}return function(o){return n.prototype=o,new n}})();function l(n,o){var c=Array.prototype.slice;if(n.bind)return n.bind.apply(n,c.call(arguments,1));var f=c.call(arguments,2);return function(){return n.apply(o,f.length?f.concat(c.call(arguments)):arguments)}}var h=0;function u(n){return"_leaflet_id"in n||(n._leaflet_id=++h),n._leaflet_id}function d(n,o,c){var f,S,C,V;return V=function(){f=!1,S&&(C.apply(c,S),S=!1)},C=function(){f?S=arguments:(n.apply(c,arguments),setTimeout(V,o),f=!0)},C}function m(n,o,c){var f=o[1],S=o[0],C=f-S;return n===f&&c?n:((n-S)%C+C)%C+S}function _(){return!1}function p(n,o){if(o===!1)return n;var c=Math.pow(10,o===void 0?6:o);return Math.round(n*c)/c}function g(n){return n.trim?n.trim():n.replace(/^\s+|\s+$/g,"")}function y(n){return g(n).split(/\s+/)}function w(n,o){Object.prototype.hasOwnProperty.call(n,"options")||(n.options=n.options?a(n.options):{});for(var c in o)n.options[c]=o[c];return n.options}function M(n,o,c){var f=[];for(var S in n)f.push(encodeURIComponent(c?S.toUpperCase():S)+"="+encodeURIComponent(n[S]));return(!o||o.indexOf("?")===-1?"?":"&")+f.join("&")}var v=/\{ *([\w_ -]+) *\}/g;function b(n,o){return n.replace(v,function(c,f){var S=o[f];if(S===void 0)throw new Error("No value provided for variable "+c);return typeof S=="function"&&(S=S(o)),S})}var I=Array.isArray||function(n){return Object.prototype.toString.call(n)==="[object Array]"};function A(n,o){for(var c=0;c<n.length;c++)if(n[c]===o)return c;return-1}var D="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";function E(n){return window["webkit"+n]||window["moz"+n]||window["ms"+n]}var x=0;function T(n){var o=+new Date,c=Math.max(0,16-(o-x));return x=o+c,window.setTimeout(n,c)}var H=window.requestAnimationFrame||E("RequestAnimationFrame")||T,F=window.cancelAnimationFrame||E("CancelAnimationFrame")||E("CancelRequestAnimationFrame")||function(n){window.clearTimeout(n)};function k(n,o,c){if(c&&H===T)n.call(o);else return H.call(window,l(n,o))}function G(n){n&&F.call(window,n)}var W={__proto__:null,extend:r,create:a,bind:l,get lastId(){return h},stamp:u,throttle:d,wrapNum:m,falseFn:_,formatNum:p,trim:g,splitWords:y,setOptions:w,getParamString:M,template:b,isArray:I,indexOf:A,emptyImageUrl:D,requestFn:H,cancelFn:F,requestAnimFrame:k,cancelAnimFrame:G};function z(){}z.extend=function(n){var o=function(){w(this),this.initialize&&this.initialize.apply(this,arguments),this.callInitHooks()},c=o.__super__=this.prototype,f=a(c);f.constructor=o,o.prototype=f;for(var S in this)Object.prototype.hasOwnProperty.call(this,S)&&S!=="prototype"&&S!=="__super__"&&(o[S]=this[S]);return n.statics&&r(o,n.statics),n.includes&&(j(n.includes),r.apply(null,[f].concat(n.includes))),r(f,n),delete f.statics,delete f.includes,f.options&&(f.options=c.options?a(c.options):{},r(f.options,n.options)),f._initHooks=[],f.callInitHooks=function(){if(!this._initHooksCalled){c.callInitHooks&&c.callInitHooks.call(this),this._initHooksCalled=!0;for(var C=0,V=f._initHooks.length;C<V;C++)f._initHooks[C].call(this)}},o},z.include=function(n){var o=this.prototype.options;return r(this.prototype,n),n.options&&(this.prototype.options=o,this.mergeOptions(n.options)),this},z.mergeOptions=function(n){return r(this.prototype.options,n),this},z.addInitHook=function(n){var o=Array.prototype.slice.call(arguments,1),c=typeof n=="function"?n:function(){this[n].apply(this,o)};return this.prototype._initHooks=this.prototype._initHooks||[],this.prototype._initHooks.push(c),this};function j(n){if(!(typeof L>"u"||!L||!L.Mixin)){n=I(n)?n:[n];for(var o=0;o<n.length;o++)n[o]===L.Mixin.Events&&console.warn("Deprecated include of L.Mixin.Events: this property will be removed in future releases, please inherit from L.Evented instead.",new Error().stack)}}var rt={on:function(n,o,c){if(typeof n=="object")for(var f in n)this._on(f,n[f],o);else{n=y(n);for(var S=0,C=n.length;S<C;S++)this._on(n[S],o,c)}return this},off:function(n,o,c){if(!arguments.length)delete this._events;else if(typeof n=="object")for(var f in n)this._off(f,n[f],o);else{n=y(n);for(var S=arguments.length===1,C=0,V=n.length;C<V;C++)S?this._off(n[C]):this._off(n[C],o,c)}return this},_on:function(n,o,c,f){if(typeof o!="function"){console.warn("wrong listener type: "+typeof o);return}if(this._listens(n,o,c)===!1){c===this&&(c=void 0);var S={fn:o,ctx:c};f&&(S.once=!0),this._events=this._events||{},this._events[n]=this._events[n]||[],this._events[n].push(S)}},_off:function(n,o,c){var f,S,C;if(this._events&&(f=this._events[n],!!f)){if(arguments.length===1){if(this._firingCount)for(S=0,C=f.length;S<C;S++)f[S].fn=_;delete this._events[n];return}if(typeof o!="function"){console.warn("wrong listener type: "+typeof o);return}var V=this._listens(n,o,c);if(V!==!1){var ut=f[V];this._firingCount&&(ut.fn=_,this._events[n]=f=f.slice()),f.splice(V,1)}}},fire:function(n,o,c){if(!this.listens(n,c))return this;var f=r({},o,{type:n,target:this,sourceTarget:o&&o.sourceTarget||this});if(this._events){var S=this._events[n];if(S){this._firingCount=this._firingCount+1||1;for(var C=0,V=S.length;C<V;C++){var ut=S[C],ft=ut.fn;ut.once&&this.off(n,ft,ut.ctx),ft.call(ut.ctx||this,f)}this._firingCount--}}return c&&this._propagateEvent(f),this},listens:function(n,o,c,f){typeof n!="string"&&console.warn('"string" type argument expected');var S=o;typeof o!="function"&&(f=!!o,S=void 0,c=void 0);var C=this._events&&this._events[n];if(C&&C.length&&this._listens(n,S,c)!==!1)return!0;if(f){for(var V in this._eventParents)if(this._eventParents[V].listens(n,o,c,f))return!0}return!1},_listens:function(n,o,c){if(!this._events)return!1;var f=this._events[n]||[];if(!o)return!!f.length;c===this&&(c=void 0);for(var S=0,C=f.length;S<C;S++)if(f[S].fn===o&&f[S].ctx===c)return S;return!1},once:function(n,o,c){if(typeof n=="object")for(var f in n)this._on(f,n[f],o,!0);else{n=y(n);for(var S=0,C=n.length;S<C;S++)this._on(n[S],o,c,!0)}return this},addEventParent:function(n){return this._eventParents=this._eventParents||{},this._eventParents[u(n)]=n,this},removeEventParent:function(n){return this._eventParents&&delete this._eventParents[u(n)],this},_propagateEvent:function(n){for(var o in this._eventParents)this._eventParents[o].fire(n.type,r({layer:n.target,propagatedFrom:n.target},n),!0)}};rt.addEventListener=rt.on,rt.removeEventListener=rt.clearAllEventListeners=rt.off,rt.addOneTimeEventListener=rt.once,rt.fireEvent=rt.fire,rt.hasEventListeners=rt.listens;var $=z.extend(rt);function st(n,o,c){this.x=c?Math.round(n):n,this.y=c?Math.round(o):o}var tt=Math.trunc||function(n){return n>0?Math.floor(n):Math.ceil(n)};st.prototype={clone:function(){return new st(this.x,this.y)},add:function(n){return this.clone()._add(Y(n))},_add:function(n){return this.x+=n.x,this.y+=n.y,this},subtract:function(n){return this.clone()._subtract(Y(n))},_subtract:function(n){return this.x-=n.x,this.y-=n.y,this},divideBy:function(n){return this.clone()._divideBy(n)},_divideBy:function(n){return this.x/=n,this.y/=n,this},multiplyBy:function(n){return this.clone()._multiplyBy(n)},_multiplyBy:function(n){return this.x*=n,this.y*=n,this},scaleBy:function(n){return new st(this.x*n.x,this.y*n.y)},unscaleBy:function(n){return new st(this.x/n.x,this.y/n.y)},round:function(){return this.clone()._round()},_round:function(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this},floor:function(){return this.clone()._floor()},_floor:function(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this},ceil:function(){return this.clone()._ceil()},_ceil:function(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this},trunc:function(){return this.clone()._trunc()},_trunc:function(){return this.x=tt(this.x),this.y=tt(this.y),this},distanceTo:function(n){n=Y(n);var o=n.x-this.x,c=n.y-this.y;return Math.sqrt(o*o+c*c)},equals:function(n){return n=Y(n),n.x===this.x&&n.y===this.y},contains:function(n){return n=Y(n),Math.abs(n.x)<=Math.abs(this.x)&&Math.abs(n.y)<=Math.abs(this.y)},toString:function(){return"Point("+p(this.x)+", "+p(this.y)+")"}};function Y(n,o,c){return n instanceof st?n:I(n)?new st(n[0],n[1]):n==null?n:typeof n=="object"&&"x"in n&&"y"in n?new st(n.x,n.y):new st(n,o,c)}function lt(n,o){if(n)for(var c=o?[n,o]:n,f=0,S=c.length;f<S;f++)this.extend(c[f])}lt.prototype={extend:function(n){var o,c;if(!n)return this;if(n instanceof st||typeof n[0]=="number"||"x"in n)o=c=Y(n);else if(n=St(n),o=n.min,c=n.max,!o||!c)return this;return!this.min&&!this.max?(this.min=o.clone(),this.max=c.clone()):(this.min.x=Math.min(o.x,this.min.x),this.max.x=Math.max(c.x,this.max.x),this.min.y=Math.min(o.y,this.min.y),this.max.y=Math.max(c.y,this.max.y)),this},getCenter:function(n){return Y((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2,n)},getBottomLeft:function(){return Y(this.min.x,this.max.y)},getTopRight:function(){return Y(this.max.x,this.min.y)},getTopLeft:function(){return this.min},getBottomRight:function(){return this.max},getSize:function(){return this.max.subtract(this.min)},contains:function(n){var o,c;return typeof n[0]=="number"||n instanceof st?n=Y(n):n=St(n),n instanceof lt?(o=n.min,c=n.max):o=c=n,o.x>=this.min.x&&c.x<=this.max.x&&o.y>=this.min.y&&c.y<=this.max.y},intersects:function(n){n=St(n);var o=this.min,c=this.max,f=n.min,S=n.max,C=S.x>=o.x&&f.x<=c.x,V=S.y>=o.y&&f.y<=c.y;return C&&V},overlaps:function(n){n=St(n);var o=this.min,c=this.max,f=n.min,S=n.max,C=S.x>o.x&&f.x<c.x,V=S.y>o.y&&f.y<c.y;return C&&V},isValid:function(){return!!(this.min&&this.max)},pad:function(n){var o=this.min,c=this.max,f=Math.abs(o.x-c.x)*n,S=Math.abs(o.y-c.y)*n;return St(Y(o.x-f,o.y-S),Y(c.x+f,c.y+S))},equals:function(n){return n?(n=St(n),this.min.equals(n.getTopLeft())&&this.max.equals(n.getBottomRight())):!1}};function St(n,o){return!n||n instanceof lt?n:new lt(n,o)}function Dt(n,o){if(n)for(var c=o?[n,o]:n,f=0,S=c.length;f<S;f++)this.extend(c[f])}Dt.prototype={extend:function(n){var o=this._southWest,c=this._northEast,f,S;if(n instanceof Mt)f=n,S=n;else if(n instanceof Dt){if(f=n._southWest,S=n._northEast,!f||!S)return this}else return n?this.extend(yt(n)||J(n)):this;return!o&&!c?(this._southWest=new Mt(f.lat,f.lng),this._northEast=new Mt(S.lat,S.lng)):(o.lat=Math.min(f.lat,o.lat),o.lng=Math.min(f.lng,o.lng),c.lat=Math.max(S.lat,c.lat),c.lng=Math.max(S.lng,c.lng)),this},pad:function(n){var o=this._southWest,c=this._northEast,f=Math.abs(o.lat-c.lat)*n,S=Math.abs(o.lng-c.lng)*n;return new Dt(new Mt(o.lat-f,o.lng-S),new Mt(c.lat+f,c.lng+S))},getCenter:function(){return new Mt((this._southWest.lat+this._northEast.lat)/2,(this._southWest.lng+this._northEast.lng)/2)},getSouthWest:function(){return this._southWest},getNorthEast:function(){return this._northEast},getNorthWest:function(){return new Mt(this.getNorth(),this.getWest())},getSouthEast:function(){return new Mt(this.getSouth(),this.getEast())},getWest:function(){return this._southWest.lng},getSouth:function(){return this._southWest.lat},getEast:function(){return this._northEast.lng},getNorth:function(){return this._northEast.lat},contains:function(n){typeof n[0]=="number"||n instanceof Mt||"lat"in n?n=yt(n):n=J(n);var o=this._southWest,c=this._northEast,f,S;return n instanceof Dt?(f=n.getSouthWest(),S=n.getNorthEast()):f=S=n,f.lat>=o.lat&&S.lat<=c.lat&&f.lng>=o.lng&&S.lng<=c.lng},intersects:function(n){n=J(n);var o=this._southWest,c=this._northEast,f=n.getSouthWest(),S=n.getNorthEast(),C=S.lat>=o.lat&&f.lat<=c.lat,V=S.lng>=o.lng&&f.lng<=c.lng;return C&&V},overlaps:function(n){n=J(n);var o=this._southWest,c=this._northEast,f=n.getSouthWest(),S=n.getNorthEast(),C=S.lat>o.lat&&f.lat<c.lat,V=S.lng>o.lng&&f.lng<c.lng;return C&&V},toBBoxString:function(){return[this.getWest(),this.getSouth(),this.getEast(),this.getNorth()].join(",")},equals:function(n,o){return n?(n=J(n),this._southWest.equals(n.getSouthWest(),o)&&this._northEast.equals(n.getNorthEast(),o)):!1},isValid:function(){return!!(this._southWest&&this._northEast)}};function J(n,o){return n instanceof Dt?n:new Dt(n,o)}function Mt(n,o,c){if(isNaN(n)||isNaN(o))throw new Error("Invalid LatLng object: ("+n+", "+o+")");this.lat=+n,this.lng=+o,c!==void 0&&(this.alt=+c)}Mt.prototype={equals:function(n,o){if(!n)return!1;n=yt(n);var c=Math.max(Math.abs(this.lat-n.lat),Math.abs(this.lng-n.lng));return c<=(o===void 0?1e-9:o)},toString:function(n){return"LatLng("+p(this.lat,n)+", "+p(this.lng,n)+")"},distanceTo:function(n){return Rt.distance(this,yt(n))},wrap:function(){return Rt.wrapLatLng(this)},toBounds:function(n){var o=180*n/40075017,c=o/Math.cos(Math.PI/180*this.lat);return J([this.lat-o,this.lng-c],[this.lat+o,this.lng+c])},clone:function(){return new Mt(this.lat,this.lng,this.alt)}};function yt(n,o,c){return n instanceof Mt?n:I(n)&&typeof n[0]!="object"?n.length===3?new Mt(n[0],n[1],n[2]):n.length===2?new Mt(n[0],n[1]):null:n==null?n:typeof n=="object"&&"lat"in n?new Mt(n.lat,"lng"in n?n.lng:n.lon,n.alt):o===void 0?null:new Mt(n,o,c)}var Wt={latLngToPoint:function(n,o){var c=this.projection.project(n),f=this.scale(o);return this.transformation._transform(c,f)},pointToLatLng:function(n,o){var c=this.scale(o),f=this.transformation.untransform(n,c);return this.projection.unproject(f)},project:function(n){return this.projection.project(n)},unproject:function(n){return this.projection.unproject(n)},scale:function(n){return 256*Math.pow(2,n)},zoom:function(n){return Math.log(n/256)/Math.LN2},getProjectedBounds:function(n){if(this.infinite)return null;var o=this.projection.bounds,c=this.scale(n),f=this.transformation.transform(o.min,c),S=this.transformation.transform(o.max,c);return new lt(f,S)},infinite:!1,wrapLatLng:function(n){var o=this.wrapLng?m(n.lng,this.wrapLng,!0):n.lng,c=this.wrapLat?m(n.lat,this.wrapLat,!0):n.lat,f=n.alt;return new Mt(c,o,f)},wrapLatLngBounds:function(n){var o=n.getCenter(),c=this.wrapLatLng(o),f=o.lat-c.lat,S=o.lng-c.lng;if(f===0&&S===0)return n;var C=n.getSouthWest(),V=n.getNorthEast(),ut=new Mt(C.lat-f,C.lng-S),ft=new Mt(V.lat-f,V.lng-S);return new Dt(ut,ft)}},Rt=r({},Wt,{wrapLng:[-180,180],R:6371e3,distance:function(n,o){var c=Math.PI/180,f=n.lat*c,S=o.lat*c,C=Math.sin((o.lat-n.lat)*c/2),V=Math.sin((o.lng-n.lng)*c/2),ut=C*C+Math.cos(f)*Math.cos(S)*V*V,ft=2*Math.atan2(Math.sqrt(ut),Math.sqrt(1-ut));return this.R*ft}}),jt=6378137,we={R:jt,MAX_LATITUDE:85.0511287798,project:function(n){var o=Math.PI/180,c=this.MAX_LATITUDE,f=Math.max(Math.min(c,n.lat),-c),S=Math.sin(f*o);return new st(this.R*n.lng*o,this.R*Math.log((1+S)/(1-S))/2)},unproject:function(n){var o=180/Math.PI;return new Mt((2*Math.atan(Math.exp(n.y/this.R))-Math.PI/2)*o,n.x*o/this.R)},bounds:(function(){var n=jt*Math.PI;return new lt([-n,-n],[n,n])})()};function Jt(n,o,c,f){if(I(n)){this._a=n[0],this._b=n[1],this._c=n[2],this._d=n[3];return}this._a=n,this._b=o,this._c=c,this._d=f}Jt.prototype={transform:function(n,o){return this._transform(n.clone(),o)},_transform:function(n,o){return o=o||1,n.x=o*(this._a*n.x+this._b),n.y=o*(this._c*n.y+this._d),n},untransform:function(n,o){return o=o||1,new st((n.x/o-this._b)/this._a,(n.y/o-this._d)/this._c)}};function fe(n,o,c,f){return new Jt(n,o,c,f)}var ve=r({},Rt,{code:"EPSG:3857",projection:we,transformation:(function(){var n=.5/(Math.PI*we.R);return fe(n,.5,-n,.5)})()}),ce=r({},ve,{code:"EPSG:900913"});function We(n){return document.createElementNS("http://www.w3.org/2000/svg",n)}function He(n,o){var c="",f,S,C,V,ut,ft;for(f=0,C=n.length;f<C;f++){for(ut=n[f],S=0,V=ut.length;S<V;S++)ft=ut[S],c+=(S?"L":"M")+ft.x+" "+ft.y;c+=o?Lt.svg?"z":"x":""}return c||"M0 0"}var Qe=document.documentElement.style,Re="ActiveXObject"in window,Ln=Re&&!document.addEventListener,ze="msLaunchUri"in navigator&&!("documentMode"in document),je=ne("webkit"),fn=ne("android"),Sn=ne("android 2")||ne("android 3"),K=parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1],10),tn=fn&&ne("Google")&&K<537&&!("AudioNode"in window),Pe=!!window.opera,Ie=!ze&&ne("chrome"),Ct=ne("gecko")&&!je&&!Pe&&!Re,ke=!Ie&&ne("safari"),Yt=ne("phantom"),te="OTransition"in Qe,O=navigator.platform.indexOf("Win")===0,R=Re&&"transition"in Qe,ht="WebKitCSSMatrix"in window&&"m11"in new window.WebKitCSSMatrix&&!Sn,N="MozPerspective"in Qe,U=!window.L_DISABLE_3D&&(R||ht||N)&&!te&&!Yt,X=typeof orientation<"u"||ne("mobile"),it=X&&je,q=X&&ht,ot=!window.PointerEvent&&window.MSPointerEvent,_t=!!(window.PointerEvent||ot),B="ontouchstart"in window||!!window.TouchEvent,at=!window.L_NO_TOUCH&&(B||_t),et=X&&Pe,vt=X&&Ct,gt=(window.devicePixelRatio||window.screen.deviceXDPI/window.screen.logicalXDPI)>1,mt=(function(){var n=!1;try{var o=Object.defineProperty({},"passive",{get:function(){n=!0}});window.addEventListener("testPassiveEventSupport",_,o),window.removeEventListener("testPassiveEventSupport",_,o)}catch{}return n})(),Ot=(function(){return!!document.createElement("canvas").getContext})(),Ft=!!(document.createElementNS&&We("svg").createSVGRect),xt=!!Ft&&(function(){var n=document.createElement("div");return n.innerHTML="<svg/>",(n.firstChild&&n.firstChild.namespaceURI)==="http://www.w3.org/2000/svg"})(),kt=!Ft&&(function(){try{var n=document.createElement("div");n.innerHTML='<v:shape adj="1"/>';var o=n.firstChild;return o.style.behavior="url(#default#VML)",o&&typeof o.adj=="object"}catch{return!1}})(),qt=navigator.platform.indexOf("Mac")===0,Pt=navigator.platform.indexOf("Linux")===0;function ne(n){return navigator.userAgent.toLowerCase().indexOf(n)>=0}var Lt={ie:Re,ielt9:Ln,edge:ze,webkit:je,android:fn,android23:Sn,androidStock:tn,opera:Pe,chrome:Ie,gecko:Ct,safari:ke,phantom:Yt,opera12:te,win:O,ie3d:R,webkit3d:ht,gecko3d:N,any3d:U,mobile:X,mobileWebkit:it,mobileWebkit3d:q,msPointer:ot,pointer:_t,touch:at,touchNative:B,mobileOpera:et,mobileGecko:vt,retina:gt,passiveEvents:mt,canvas:Ot,svg:Ft,vml:kt,inlineSvg:xt,mac:qt,linux:Pt},Tn=Lt.msPointer?"MSPointerDown":"pointerdown",Ni=Lt.msPointer?"MSPointerMove":"pointermove",Fi=Lt.msPointer?"MSPointerUp":"pointerup",ns=Lt.msPointer?"MSPointerCancel":"pointercancel",Ws={touchstart:Tn,touchmove:Ni,touchend:Fi,touchcancel:ns},Lr={touchstart:Eo,touchmove:qs,touchend:qs,touchcancel:qs},Bn={},Xs=!1;function So(n,o,c){return o==="touchstart"&&ws(),Lr[o]?(c=Lr[o].bind(this,c),n.addEventListener(Ws[o],c,!1),c):(console.warn("wrong event specified:",o),_)}function wo(n,o,c){if(!Ws[o]){console.warn("wrong event specified:",o);return}n.removeEventListener(Ws[o],c,!1)}function Zs(n){Bn[n.pointerId]=n}function bo(n){Bn[n.pointerId]&&(Bn[n.pointerId]=n)}function Ir(n){delete Bn[n.pointerId]}function ws(){Xs||(document.addEventListener(Tn,Zs,!0),document.addEventListener(Ni,bo,!0),document.addEventListener(Fi,Ir,!0),document.addEventListener(ns,Ir,!0),Xs=!0)}function qs(n,o){if(o.pointerType!==(o.MSPOINTER_TYPE_MOUSE||"mouse")){o.touches=[];for(var c in Bn)o.touches.push(Bn[c]);o.changedTouches=[o],n(o)}}function Eo(n,o){o.MSPOINTER_TYPE_TOUCH&&o.pointerType===o.MSPOINTER_TYPE_TOUCH&&wn(o),qs(n,o)}function To(n){var o={},c,f;for(f in n)c=n[f],o[f]=c&&c.bind?c.bind(n):c;return n=o,o.type="dblclick",o.detail=2,o.isTrusted=!1,o._simulated=!0,o}var $a=200;function Ya(n,o){n.addEventListener("dblclick",o);var c=0,f;function S(C){if(C.detail!==1){f=C.detail;return}if(!(C.pointerType==="mouse"||C.sourceCapabilities&&!C.sourceCapabilities.firesTouchEvents)){var V=Lh(C);if(!(V.some(function(ft){return ft instanceof HTMLLabelElement&&ft.attributes.for})&&!V.some(function(ft){return ft instanceof HTMLInputElement||ft instanceof HTMLSelectElement}))){var ut=Date.now();ut-c<=$a?(f++,f===2&&o(To(C))):f=1,c=ut}}}return n.addEventListener("click",S),{dblclick:o,simDblclick:S}}function Ka(n,o){n.removeEventListener("dblclick",o.dblclick),n.removeEventListener("click",o.simDblclick)}var $s=Ee(["transform","webkitTransform","OTransform","MozTransform","msTransform"]),P=Ee(["webkitTransition","transition","OTransition","MozTransition","msTransition"]),Z=P==="webkitTransition"||P==="OTransition"?P+"End":"transitionend";function dt(n){return typeof n=="string"?document.getElementById(n):n}function ct(n,o){var c=n.style[o]||n.currentStyle&&n.currentStyle[o];if((!c||c==="auto")&&document.defaultView){var f=document.defaultView.getComputedStyle(n,null);c=f?f[o]:null}return c==="auto"?null:c}function Q(n,o,c){var f=document.createElement(n);return f.className=o||"",c&&c.appendChild(f),f}function wt(n){var o=n.parentNode;o&&o.removeChild(n)}function Vt(n){for(;n.firstChild;)n.removeChild(n.firstChild)}function At(n){var o=n.parentNode;o&&o.lastChild!==n&&o.appendChild(n)}function Ut(n){var o=n.parentNode;o&&o.firstChild!==n&&o.insertBefore(n,o.firstChild)}function Zt(n,o){if(n.classList!==void 0)return n.classList.contains(o);var c=he(n);return c.length>0&&new RegExp("(^|\\s)"+o+"(\\s|$)").test(c)}function It(n,o){if(n.classList!==void 0)for(var c=y(o),f=0,S=c.length;f<S;f++)n.classList.add(c[f]);else if(!Zt(n,o)){var C=he(n);Xt(n,(C?C+" ":"")+o)}}function $t(n,o){n.classList!==void 0?n.classList.remove(o):Xt(n,g((" "+he(n)+" ").replace(" "+o+" "," ")))}function Xt(n,o){n.className.baseVal===void 0?n.className=o:n.className.baseVal=o}function he(n){return n.correspondingElement&&(n=n.correspondingElement),n.className.baseVal===void 0?n.className:n.className.baseVal}function be(n,o){"opacity"in n.style?n.style.opacity=o:"filter"in n.style&&Ne(n,o)}function Ne(n,o){var c=!1,f="DXImageTransform.Microsoft.Alpha";try{c=n.filters.item(f)}catch{if(o===1)return}o=Math.round(o*100),c?(c.Enabled=o!==100,c.Opacity=o):n.style.filter+=" progid:"+f+"(opacity="+o+")"}function Ee(n){for(var o=document.documentElement.style,c=0;c<n.length;c++)if(n[c]in o)return n[c];return!1}function Ge(n,o,c){var f=o||new st(0,0);n.style[$s]=(Lt.ie3d?"translate("+f.x+"px,"+f.y+"px)":"translate3d("+f.x+"px,"+f.y+"px,0)")+(c?" scale("+c+")":"")}function Nt(n,o){n._leaflet_pos=o,Lt.any3d?Ge(n,o):(n.style.left=o.x+"px",n.style.top=o.y+"px")}function Xe(n){return n._leaflet_pos||new st(0,0)}var ge,Gn,en;if("onselectstart"in document)ge=function(){ae(window,"selectstart",wn)},Gn=function(){Be(window,"selectstart",wn)};else{var xi=Ee(["userSelect","WebkitUserSelect","OUserSelect","MozUserSelect","msUserSelect"]);ge=function(){if(xi){var n=document.documentElement.style;en=n[xi],n[xi]="none"}},Gn=function(){xi&&(document.documentElement.style[xi]=en,en=void 0)}}function Qn(){ae(window,"dragstart",wn)}function ri(){Be(window,"dragstart",wn)}var me,$e;function In(n){for(;n.tabIndex===-1;)n=n.parentNode;n.style&&(Fe(),me=n,$e=n.style.outlineStyle,n.style.outlineStyle="none",ae(window,"keydown",Fe))}function Fe(){me&&(me.style.outlineStyle=$e,me=void 0,$e=void 0,Be(window,"keydown",Fe))}function Ye(n){do n=n.parentNode;while((!n.offsetWidth||!n.offsetHeight)&&n!==document.body);return n}function Vn(n){var o=n.getBoundingClientRect();return{x:o.width/n.offsetWidth||1,y:o.height/n.offsetHeight||1,boundingClientRect:o}}var Ao={__proto__:null,TRANSFORM:$s,TRANSITION:P,TRANSITION_END:Z,get:dt,getStyle:ct,create:Q,remove:wt,empty:Vt,toFront:At,toBack:Ut,hasClass:Zt,addClass:It,removeClass:$t,setClass:Xt,getClass:he,setOpacity:be,testProp:Ee,setTransform:Ge,setPosition:Nt,getPosition:Xe,get disableTextSelection(){return ge},get enableTextSelection(){return Gn},disableImageDrag:Qn,enableImageDrag:ri,preventOutline:In,restoreOutline:Fe,getSizedParentNode:Ye,getScale:Vn};function ae(n,o,c,f){if(o&&typeof o=="object")for(var S in o)Qa(n,S,o[S],c);else{o=y(o);for(var C=0,V=o.length;C<V;C++)Qa(n,o[C],c,f)}return this}var Mi="_leaflet_events";function Be(n,o,c,f){if(arguments.length===1)Ch(n),delete n[Mi];else if(o&&typeof o=="object")for(var S in o)ja(n,S,o[S],c);else if(o=y(o),arguments.length===2)Ch(n,function(ut){return A(o,ut)!==-1});else for(var C=0,V=o.length;C<V;C++)ja(n,o[C],c,f);return this}function Ch(n,o){for(var c in n[Mi]){var f=c.split(/\d/)[0];(!o||o(f))&&ja(n,f,null,null,c)}}var Ja={mouseenter:"mouseover",mouseleave:"mouseout",wheel:!("onwheel"in window)&&"mousewheel"};function Qa(n,o,c,f){var S=o+u(c)+(f?"_"+u(f):"");if(n[Mi]&&n[Mi][S])return this;var C=function(ut){return c.call(f||n,ut||window.event)},V=C;!Lt.touchNative&&Lt.pointer&&o.indexOf("touch")===0?C=So(n,o,C):Lt.touch&&o==="dblclick"?C=Ya(n,C):"addEventListener"in n?o==="touchstart"||o==="touchmove"||o==="wheel"||o==="mousewheel"?n.addEventListener(Ja[o]||o,C,Lt.passiveEvents?{passive:!1}:!1):o==="mouseenter"||o==="mouseleave"?(C=function(ut){ut=ut||window.event,el(n,ut)&&V(ut)},n.addEventListener(Ja[o],C,!1)):n.addEventListener(o,V,!1):n.attachEvent("on"+o,C),n[Mi]=n[Mi]||{},n[Mi][S]=C}function ja(n,o,c,f,S){S=S||o+u(c)+(f?"_"+u(f):"");var C=n[Mi]&&n[Mi][S];if(!C)return this;!Lt.touchNative&&Lt.pointer&&o.indexOf("touch")===0?wo(n,o,C):Lt.touch&&o==="dblclick"?Ka(n,C):"removeEventListener"in n?n.removeEventListener(Ja[o]||o,C,!1):n.detachEvent("on"+o,C),n[Mi][S]=null}function bs(n){return n.stopPropagation?n.stopPropagation():n.originalEvent?n.originalEvent._stopped=!0:n.cancelBubble=!0,this}function tl(n){return Qa(n,"wheel",bs),this}function Dr(n){return ae(n,"mousedown touchstart dblclick contextmenu",bs),n._leaflet_disable_click=!0,this}function wn(n){return n.preventDefault?n.preventDefault():n.returnValue=!1,this}function Es(n){return wn(n),bs(n),this}function Lh(n){if(n.composedPath)return n.composedPath();for(var o=[],c=n.target;c;)o.push(c),c=c.parentNode;return o}function Ih(n,o){if(!o)return new st(n.clientX,n.clientY);var c=Vn(o),f=c.boundingClientRect;return new st((n.clientX-f.left)/c.x-o.clientLeft,(n.clientY-f.top)/c.y-o.clientTop)}var up=Lt.linux&&Lt.chrome?window.devicePixelRatio:Lt.mac?window.devicePixelRatio*3:window.devicePixelRatio>0?2*window.devicePixelRatio:1;function Dh(n){return Lt.edge?n.wheelDeltaY/2:n.deltaY&&n.deltaMode===0?-n.deltaY/up:n.deltaY&&n.deltaMode===1?-n.deltaY*20:n.deltaY&&n.deltaMode===2?-n.deltaY*60:n.deltaX||n.deltaZ?0:n.wheelDelta?(n.wheelDeltaY||n.wheelDelta)/2:n.detail&&Math.abs(n.detail)<32765?-n.detail*20:n.detail?n.detail/-32765*60:0}function el(n,o){var c=o.relatedTarget;if(!c)return!0;try{for(;c&&c!==n;)c=c.parentNode}catch{return!1}return c!==n}var dp={__proto__:null,on:ae,off:Be,stopPropagation:bs,disableScrollPropagation:tl,disableClickPropagation:Dr,preventDefault:wn,stop:Es,getPropagationPath:Lh,getMousePosition:Ih,getWheelDelta:Dh,isExternalTarget:el,addListener:ae,removeListener:Be},Nh=$.extend({run:function(n,o,c,f){this.stop(),this._el=n,this._inProgress=!0,this._duration=c||.25,this._easeOutPower=1/Math.max(f||.5,.2),this._startPos=Xe(n),this._offset=o.subtract(this._startPos),this._startTime=+new Date,this.fire("start"),this._animate()},stop:function(){this._inProgress&&(this._step(!0),this._complete())},_animate:function(){this._animId=k(this._animate,this),this._step()},_step:function(n){var o=+new Date-this._startTime,c=this._duration*1e3;o<c?this._runFrame(this._easeOut(o/c),n):(this._runFrame(1),this._complete())},_runFrame:function(n,o){var c=this._startPos.add(this._offset.multiplyBy(n));o&&c._round(),Nt(this._el,c),this.fire("step")},_complete:function(){G(this._animId),this._inProgress=!1,this.fire("end")},_easeOut:function(n){return 1-Math.pow(1-n,this._easeOutPower)}}),Se=$.extend({options:{crs:ve,center:void 0,zoom:void 0,minZoom:void 0,maxZoom:void 0,layers:[],maxBounds:void 0,renderer:void 0,zoomAnimation:!0,zoomAnimationThreshold:4,fadeAnimation:!0,markerZoomAnimation:!0,transform3DLimit:8388608,zoomSnap:1,zoomDelta:1,trackResize:!0},initialize:function(n,o){o=w(this,o),this._handlers=[],this._layers={},this._zoomBoundLayers={},this._sizeChanged=!0,this._initContainer(n),this._initLayout(),this._onResize=l(this._onResize,this),this._initEvents(),o.maxBounds&&this.setMaxBounds(o.maxBounds),o.zoom!==void 0&&(this._zoom=this._limitZoom(o.zoom)),o.center&&o.zoom!==void 0&&this.setView(yt(o.center),o.zoom,{reset:!0}),this.callInitHooks(),this._zoomAnimated=P&&Lt.any3d&&!Lt.mobileOpera&&this.options.zoomAnimation,this._zoomAnimated&&(this._createAnimProxy(),ae(this._proxy,Z,this._catchTransitionEnd,this)),this._addLayers(this.options.layers)},setView:function(n,o,c){if(o=o===void 0?this._zoom:this._limitZoom(o),n=this._limitCenter(yt(n),o,this.options.maxBounds),c=c||{},this._stop(),this._loaded&&!c.reset&&c!==!0){c.animate!==void 0&&(c.zoom=r({animate:c.animate},c.zoom),c.pan=r({animate:c.animate,duration:c.duration},c.pan));var f=this._zoom!==o?this._tryAnimatedZoom&&this._tryAnimatedZoom(n,o,c.zoom):this._tryAnimatedPan(n,c.pan);if(f)return clearTimeout(this._sizeTimer),this}return this._resetView(n,o,c.pan&&c.pan.noMoveStart),this},setZoom:function(n,o){return this._loaded?this.setView(this.getCenter(),n,{zoom:o}):(this._zoom=n,this)},zoomIn:function(n,o){return n=n||(Lt.any3d?this.options.zoomDelta:1),this.setZoom(this._zoom+n,o)},zoomOut:function(n,o){return n=n||(Lt.any3d?this.options.zoomDelta:1),this.setZoom(this._zoom-n,o)},setZoomAround:function(n,o,c){var f=this.getZoomScale(o),S=this.getSize().divideBy(2),C=n instanceof st?n:this.latLngToContainerPoint(n),V=C.subtract(S).multiplyBy(1-1/f),ut=this.containerPointToLatLng(S.add(V));return this.setView(ut,o,{zoom:c})},_getBoundsCenterZoom:function(n,o){o=o||{},n=n.getBounds?n.getBounds():J(n);var c=Y(o.paddingTopLeft||o.padding||[0,0]),f=Y(o.paddingBottomRight||o.padding||[0,0]),S=this.getBoundsZoom(n,!1,c.add(f));if(S=typeof o.maxZoom=="number"?Math.min(o.maxZoom,S):S,S===1/0)return{center:n.getCenter(),zoom:S};var C=f.subtract(c).divideBy(2),V=this.project(n.getSouthWest(),S),ut=this.project(n.getNorthEast(),S),ft=this.unproject(V.add(ut).divideBy(2).add(C),S);return{center:ft,zoom:S}},fitBounds:function(n,o){if(n=J(n),!n.isValid())throw new Error("Bounds are not valid.");var c=this._getBoundsCenterZoom(n,o);return this.setView(c.center,c.zoom,o)},fitWorld:function(n){return this.fitBounds([[-90,-180],[90,180]],n)},panTo:function(n,o){return this.setView(n,this._zoom,{pan:o})},panBy:function(n,o){if(n=Y(n).round(),o=o||{},!n.x&&!n.y)return this.fire("moveend");if(o.animate!==!0&&!this.getSize().contains(n))return this._resetView(this.unproject(this.project(this.getCenter()).add(n)),this.getZoom()),this;if(this._panAnim||(this._panAnim=new Nh,this._panAnim.on({step:this._onPanTransitionStep,end:this._onPanTransitionEnd},this)),o.noMoveStart||this.fire("movestart"),o.animate!==!1){It(this._mapPane,"leaflet-pan-anim");var c=this._getMapPanePos().subtract(n).round();this._panAnim.run(this._mapPane,c,o.duration||.25,o.easeLinearity)}else this._rawPanBy(n),this.fire("move").fire("moveend");return this},flyTo:function(n,o,c){if(c=c||{},c.animate===!1||!Lt.any3d)return this.setView(n,o,c);this._stop();var f=this.project(this.getCenter()),S=this.project(n),C=this.getSize(),V=this._zoom;n=yt(n),o=o===void 0?V:o;var ut=Math.max(C.x,C.y),ft=ut*this.getZoomScale(V,o),Et=S.distanceTo(f)||1,Gt=1.42,ee=Gt*Gt;function _e(nn){var Bo=nn?-1:1,tm=nn?ft:ut,em=ft*ft-ut*ut+Bo*ee*ee*Et*Et,nm=2*tm*ee*Et,dl=em/nm,pu=Math.sqrt(dl*dl+1)-dl,im=pu<1e-9?-18:Math.log(pu);return im}function Dn(nn){return(Math.exp(nn)-Math.exp(-nn))/2}function pn(nn){return(Math.exp(nn)+Math.exp(-nn))/2}function ti(nn){return Dn(nn)/pn(nn)}var kn=_e(0);function tr(nn){return ut*(pn(kn)/pn(kn+Gt*nn))}function Kp(nn){return ut*(pn(kn)*ti(kn+Gt*nn)-Dn(kn))/ee}function Jp(nn){return 1-Math.pow(1-nn,1.5)}var Qp=Date.now(),du=(_e(1)-kn)/Gt,jp=c.duration?1e3*c.duration:1e3*du*.8;function fu(){var nn=(Date.now()-Qp)/jp,Bo=Jp(nn)*du;nn<=1?(this._flyToFrame=k(fu,this),this._move(this.unproject(f.add(S.subtract(f).multiplyBy(Kp(Bo)/Et)),V),this.getScaleZoom(ut/tr(Bo),V),{flyTo:!0})):this._move(n,o)._moveEnd(!0)}return this._moveStart(!0,c.noMoveStart),fu.call(this),this},flyToBounds:function(n,o){var c=this._getBoundsCenterZoom(n,o);return this.flyTo(c.center,c.zoom,o)},setMaxBounds:function(n){return n=J(n),this.listens("moveend",this._panInsideMaxBounds)&&this.off("moveend",this._panInsideMaxBounds),n.isValid()?(this.options.maxBounds=n,this._loaded&&this._panInsideMaxBounds(),this.on("moveend",this._panInsideMaxBounds)):(this.options.maxBounds=null,this)},setMinZoom:function(n){var o=this.options.minZoom;return this.options.minZoom=n,this._loaded&&o!==n&&(this.fire("zoomlevelschange"),this.getZoom()<this.options.minZoom)?this.setZoom(n):this},setMaxZoom:function(n){var o=this.options.maxZoom;return this.options.maxZoom=n,this._loaded&&o!==n&&(this.fire("zoomlevelschange"),this.getZoom()>this.options.maxZoom)?this.setZoom(n):this},panInsideBounds:function(n,o){this._enforcingBounds=!0;var c=this.getCenter(),f=this._limitCenter(c,this._zoom,J(n));return c.equals(f)||this.panTo(f,o),this._enforcingBounds=!1,this},panInside:function(n,o){o=o||{};var c=Y(o.paddingTopLeft||o.padding||[0,0]),f=Y(o.paddingBottomRight||o.padding||[0,0]),S=this.project(this.getCenter()),C=this.project(n),V=this.getPixelBounds(),ut=St([V.min.add(c),V.max.subtract(f)]),ft=ut.getSize();if(!ut.contains(C)){this._enforcingBounds=!0;var Et=C.subtract(ut.getCenter()),Gt=ut.extend(C).getSize().subtract(ft);S.x+=Et.x<0?-Gt.x:Gt.x,S.y+=Et.y<0?-Gt.y:Gt.y,this.panTo(this.unproject(S),o),this._enforcingBounds=!1}return this},invalidateSize:function(n){if(!this._loaded)return this;n=r({animate:!1,pan:!0},n===!0?{animate:!0}:n);var o=this.getSize();this._sizeChanged=!0,this._lastCenter=null;var c=this.getSize(),f=o.divideBy(2).round(),S=c.divideBy(2).round(),C=f.subtract(S);return!C.x&&!C.y?this:(n.animate&&n.pan?this.panBy(C):(n.pan&&this._rawPanBy(C),this.fire("move"),n.debounceMoveend?(clearTimeout(this._sizeTimer),this._sizeTimer=setTimeout(l(this.fire,this,"moveend"),200)):this.fire("moveend")),this.fire("resize",{oldSize:o,newSize:c}))},stop:function(){return this.setZoom(this._limitZoom(this._zoom)),this.options.zoomSnap||this.fire("viewreset"),this._stop()},locate:function(n){if(n=this._locateOptions=r({timeout:1e4,watch:!1},n),!("geolocation"in navigator))return this._handleGeolocationError({code:0,message:"Geolocation not supported."}),this;var o=l(this._handleGeolocationResponse,this),c=l(this._handleGeolocationError,this);return n.watch?this._locationWatchId=navigator.geolocation.watchPosition(o,c,n):navigator.geolocation.getCurrentPosition(o,c,n),this},stopLocate:function(){return navigator.geolocation&&navigator.geolocation.clearWatch&&navigator.geolocation.clearWatch(this._locationWatchId),this._locateOptions&&(this._locateOptions.setView=!1),this},_handleGeolocationError:function(n){if(this._container._leaflet_id){var o=n.code,c=n.message||(o===1?"permission denied":o===2?"position unavailable":"timeout");this._locateOptions.setView&&!this._loaded&&this.fitWorld(),this.fire("locationerror",{code:o,message:"Geolocation error: "+c+"."})}},_handleGeolocationResponse:function(n){if(this._container._leaflet_id){var o=n.coords.latitude,c=n.coords.longitude,f=new Mt(o,c),S=f.toBounds(n.coords.accuracy*2),C=this._locateOptions;if(C.setView){var V=this.getBoundsZoom(S);this.setView(f,C.maxZoom?Math.min(V,C.maxZoom):V)}var ut={latlng:f,bounds:S,timestamp:n.timestamp};for(var ft in n.coords)typeof n.coords[ft]=="number"&&(ut[ft]=n.coords[ft]);this.fire("locationfound",ut)}},addHandler:function(n,o){if(!o)return this;var c=this[n]=new o(this);return this._handlers.push(c),this.options[n]&&c.enable(),this},remove:function(){if(this._initEvents(!0),this.options.maxBounds&&this.off("moveend",this._panInsideMaxBounds),this._containerId!==this._container._leaflet_id)throw new Error("Map container is being reused by another instance");try{delete this._container._leaflet_id,delete this._containerId}catch{this._container._leaflet_id=void 0,this._containerId=void 0}this._locationWatchId!==void 0&&this.stopLocate(),this._stop(),wt(this._mapPane),this._clearControlPos&&this._clearControlPos(),this._resizeRequest&&(G(this._resizeRequest),this._resizeRequest=null),this._clearHandlers(),this._loaded&&this.fire("unload");var n;for(n in this._layers)this._layers[n].remove();for(n in this._panes)wt(this._panes[n]);return this._layers=[],this._panes=[],delete this._mapPane,delete this._renderer,this},createPane:function(n,o){var c="leaflet-pane"+(n?" leaflet-"+n.replace("Pane","")+"-pane":""),f=Q("div",c,o||this._mapPane);return n&&(this._panes[n]=f),f},getCenter:function(){return this._checkIfLoaded(),this._lastCenter&&!this._moved()?this._lastCenter.clone():this.layerPointToLatLng(this._getCenterLayerPoint())},getZoom:function(){return this._zoom},getBounds:function(){var n=this.getPixelBounds(),o=this.unproject(n.getBottomLeft()),c=this.unproject(n.getTopRight());return new Dt(o,c)},getMinZoom:function(){return this.options.minZoom===void 0?this._layersMinZoom||0:this.options.minZoom},getMaxZoom:function(){return this.options.maxZoom===void 0?this._layersMaxZoom===void 0?1/0:this._layersMaxZoom:this.options.maxZoom},getBoundsZoom:function(n,o,c){n=J(n),c=Y(c||[0,0]);var f=this.getZoom()||0,S=this.getMinZoom(),C=this.getMaxZoom(),V=n.getNorthWest(),ut=n.getSouthEast(),ft=this.getSize().subtract(c),Et=St(this.project(ut,f),this.project(V,f)).getSize(),Gt=Lt.any3d?this.options.zoomSnap:1,ee=ft.x/Et.x,_e=ft.y/Et.y,Dn=o?Math.max(ee,_e):Math.min(ee,_e);return f=this.getScaleZoom(Dn,f),Gt&&(f=Math.round(f/(Gt/100))*(Gt/100),f=o?Math.ceil(f/Gt)*Gt:Math.floor(f/Gt)*Gt),Math.max(S,Math.min(C,f))},getSize:function(){return(!this._size||this._sizeChanged)&&(this._size=new st(this._container.clientWidth||0,this._container.clientHeight||0),this._sizeChanged=!1),this._size.clone()},getPixelBounds:function(n,o){var c=this._getTopLeftPoint(n,o);return new lt(c,c.add(this.getSize()))},getPixelOrigin:function(){return this._checkIfLoaded(),this._pixelOrigin},getPixelWorldBounds:function(n){return this.options.crs.getProjectedBounds(n===void 0?this.getZoom():n)},getPane:function(n){return typeof n=="string"?this._panes[n]:n},getPanes:function(){return this._panes},getContainer:function(){return this._container},getZoomScale:function(n,o){var c=this.options.crs;return o=o===void 0?this._zoom:o,c.scale(n)/c.scale(o)},getScaleZoom:function(n,o){var c=this.options.crs;o=o===void 0?this._zoom:o;var f=c.zoom(n*c.scale(o));return isNaN(f)?1/0:f},project:function(n,o){return o=o===void 0?this._zoom:o,this.options.crs.latLngToPoint(yt(n),o)},unproject:function(n,o){return o=o===void 0?this._zoom:o,this.options.crs.pointToLatLng(Y(n),o)},layerPointToLatLng:function(n){var o=Y(n).add(this.getPixelOrigin());return this.unproject(o)},latLngToLayerPoint:function(n){var o=this.project(yt(n))._round();return o._subtract(this.getPixelOrigin())},wrapLatLng:function(n){return this.options.crs.wrapLatLng(yt(n))},wrapLatLngBounds:function(n){return this.options.crs.wrapLatLngBounds(J(n))},distance:function(n,o){return this.options.crs.distance(yt(n),yt(o))},containerPointToLayerPoint:function(n){return Y(n).subtract(this._getMapPanePos())},layerPointToContainerPoint:function(n){return Y(n).add(this._getMapPanePos())},containerPointToLatLng:function(n){var o=this.containerPointToLayerPoint(Y(n));return this.layerPointToLatLng(o)},latLngToContainerPoint:function(n){return this.layerPointToContainerPoint(this.latLngToLayerPoint(yt(n)))},mouseEventToContainerPoint:function(n){return Ih(n,this._container)},mouseEventToLayerPoint:function(n){return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(n))},mouseEventToLatLng:function(n){return this.layerPointToLatLng(this.mouseEventToLayerPoint(n))},_initContainer:function(n){var o=this._container=dt(n);if(o){if(o._leaflet_id)throw new Error("Map container is already initialized.")}else throw new Error("Map container not found.");ae(o,"scroll",this._onScroll,this),this._containerId=u(o)},_initLayout:function(){var n=this._container;this._fadeAnimated=this.options.fadeAnimation&&Lt.any3d,It(n,"leaflet-container"+(Lt.touch?" leaflet-touch":"")+(Lt.retina?" leaflet-retina":"")+(Lt.ielt9?" leaflet-oldie":"")+(Lt.safari?" leaflet-safari":"")+(this._fadeAnimated?" leaflet-fade-anim":""));var o=ct(n,"position");o!=="absolute"&&o!=="relative"&&o!=="fixed"&&o!=="sticky"&&(n.style.position="relative"),this._initPanes(),this._initControlPos&&this._initControlPos()},_initPanes:function(){var n=this._panes={};this._paneRenderers={},this._mapPane=this.createPane("mapPane",this._container),Nt(this._mapPane,new st(0,0)),this.createPane("tilePane"),this.createPane("overlayPane"),this.createPane("shadowPane"),this.createPane("markerPane"),this.createPane("tooltipPane"),this.createPane("popupPane"),this.options.markerZoomAnimation||(It(n.markerPane,"leaflet-zoom-hide"),It(n.shadowPane,"leaflet-zoom-hide"))},_resetView:function(n,o,c){Nt(this._mapPane,new st(0,0));var f=!this._loaded;this._loaded=!0,o=this._limitZoom(o),this.fire("viewprereset");var S=this._zoom!==o;this._moveStart(S,c)._move(n,o)._moveEnd(S),this.fire("viewreset"),f&&this.fire("load")},_moveStart:function(n,o){return n&&this.fire("zoomstart"),o||this.fire("movestart"),this},_move:function(n,o,c,f){o===void 0&&(o=this._zoom);var S=this._zoom!==o;return this._zoom=o,this._lastCenter=n,this._pixelOrigin=this._getNewPixelOrigin(n),f?c&&c.pinch&&this.fire("zoom",c):((S||c&&c.pinch)&&this.fire("zoom",c),this.fire("move",c)),this},_moveEnd:function(n){return n&&this.fire("zoomend"),this.fire("moveend")},_stop:function(){return G(this._flyToFrame),this._panAnim&&this._panAnim.stop(),this},_rawPanBy:function(n){Nt(this._mapPane,this._getMapPanePos().subtract(n))},_getZoomSpan:function(){return this.getMaxZoom()-this.getMinZoom()},_panInsideMaxBounds:function(){this._enforcingBounds||this.panInsideBounds(this.options.maxBounds)},_checkIfLoaded:function(){if(!this._loaded)throw new Error("Set map center and zoom first.")},_initEvents:function(n){this._targets={},this._targets[u(this._container)]=this;var o=n?Be:ae;o(this._container,"click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu keypress keydown keyup",this._handleDOMEvent,this),this.options.trackResize&&o(window,"resize",this._onResize,this),Lt.any3d&&this.options.transform3DLimit&&(n?this.off:this.on).call(this,"moveend",this._onMoveEnd)},_onResize:function(){G(this._resizeRequest),this._resizeRequest=k(function(){this.invalidateSize({debounceMoveend:!0})},this)},_onScroll:function(){this._container.scrollTop=0,this._container.scrollLeft=0},_onMoveEnd:function(){var n=this._getMapPanePos();Math.max(Math.abs(n.x),Math.abs(n.y))>=this.options.transform3DLimit&&this._resetView(this.getCenter(),this.getZoom())},_findEventTargets:function(n,o){for(var c=[],f,S=o==="mouseout"||o==="mouseover",C=n.target||n.srcElement,V=!1;C;){if(f=this._targets[u(C)],f&&(o==="click"||o==="preclick")&&this._draggableMoved(f)){V=!0;break}if(f&&f.listens(o,!0)&&(S&&!el(C,n)||(c.push(f),S))||C===this._container)break;C=C.parentNode}return!c.length&&!V&&!S&&this.listens(o,!0)&&(c=[this]),c},_isClickDisabled:function(n){for(;n&&n!==this._container;){if(n._leaflet_disable_click)return!0;n=n.parentNode}},_handleDOMEvent:function(n){var o=n.target||n.srcElement;if(!(!this._loaded||o._leaflet_disable_events||n.type==="click"&&this._isClickDisabled(o))){var c=n.type;c==="mousedown"&&In(o),this._fireDOMEvent(n,c)}},_mouseEvents:["click","dblclick","mouseover","mouseout","contextmenu"],_fireDOMEvent:function(n,o,c){if(n.type==="click"){var f=r({},n);f.type="preclick",this._fireDOMEvent(f,f.type,c)}var S=this._findEventTargets(n,o);if(c){for(var C=[],V=0;V<c.length;V++)c[V].listens(o,!0)&&C.push(c[V]);S=C.concat(S)}if(S.length){o==="contextmenu"&&wn(n);var ut=S[0],ft={originalEvent:n};if(n.type!=="keypress"&&n.type!=="keydown"&&n.type!=="keyup"){var Et=ut.getLatLng&&(!ut._radius||ut._radius<=10);ft.containerPoint=Et?this.latLngToContainerPoint(ut.getLatLng()):this.mouseEventToContainerPoint(n),ft.layerPoint=this.containerPointToLayerPoint(ft.containerPoint),ft.latlng=Et?ut.getLatLng():this.layerPointToLatLng(ft.layerPoint)}for(V=0;V<S.length;V++)if(S[V].fire(o,ft,!0),ft.originalEvent._stopped||S[V].options.bubblingMouseEvents===!1&&A(this._mouseEvents,o)!==-1)return}},_draggableMoved:function(n){return n=n.dragging&&n.dragging.enabled()?n:this,n.dragging&&n.dragging.moved()||this.boxZoom&&this.boxZoom.moved()},_clearHandlers:function(){for(var n=0,o=this._handlers.length;n<o;n++)this._handlers[n].disable()},whenReady:function(n,o){return this._loaded?n.call(o||this,{target:this}):this.on("load",n,o),this},_getMapPanePos:function(){return Xe(this._mapPane)||new st(0,0)},_moved:function(){var n=this._getMapPanePos();return n&&!n.equals([0,0])},_getTopLeftPoint:function(n,o){var c=n&&o!==void 0?this._getNewPixelOrigin(n,o):this.getPixelOrigin();return c.subtract(this._getMapPanePos())},_getNewPixelOrigin:function(n,o){var c=this.getSize()._divideBy(2);return this.project(n,o)._subtract(c)._add(this._getMapPanePos())._round()},_latLngToNewLayerPoint:function(n,o,c){var f=this._getNewPixelOrigin(c,o);return this.project(n,o)._subtract(f)},_latLngBoundsToNewLayerBounds:function(n,o,c){var f=this._getNewPixelOrigin(c,o);return St([this.project(n.getSouthWest(),o)._subtract(f),this.project(n.getNorthWest(),o)._subtract(f),this.project(n.getSouthEast(),o)._subtract(f),this.project(n.getNorthEast(),o)._subtract(f)])},_getCenterLayerPoint:function(){return this.containerPointToLayerPoint(this.getSize()._divideBy(2))},_getCenterOffset:function(n){return this.latLngToLayerPoint(n).subtract(this._getCenterLayerPoint())},_limitCenter:function(n,o,c){if(!c)return n;var f=this.project(n,o),S=this.getSize().divideBy(2),C=new lt(f.subtract(S),f.add(S)),V=this._getBoundsOffset(C,c,o);return Math.abs(V.x)<=1&&Math.abs(V.y)<=1?n:this.unproject(f.add(V),o)},_limitOffset:function(n,o){if(!o)return n;var c=this.getPixelBounds(),f=new lt(c.min.add(n),c.max.add(n));return n.add(this._getBoundsOffset(f,o))},_getBoundsOffset:function(n,o,c){var f=St(this.project(o.getNorthEast(),c),this.project(o.getSouthWest(),c)),S=f.min.subtract(n.min),C=f.max.subtract(n.max),V=this._rebound(S.x,-C.x),ut=this._rebound(S.y,-C.y);return new st(V,ut)},_rebound:function(n,o){return n+o>0?Math.round(n-o)/2:Math.max(0,Math.ceil(n))-Math.max(0,Math.floor(o))},_limitZoom:function(n){var o=this.getMinZoom(),c=this.getMaxZoom(),f=Lt.any3d?this.options.zoomSnap:1;return f&&(n=Math.round(n/f)*f),Math.max(o,Math.min(c,n))},_onPanTransitionStep:function(){this.fire("move")},_onPanTransitionEnd:function(){$t(this._mapPane,"leaflet-pan-anim"),this.fire("moveend")},_tryAnimatedPan:function(n,o){var c=this._getCenterOffset(n)._trunc();return(o&&o.animate)!==!0&&!this.getSize().contains(c)?!1:(this.panBy(c,o),!0)},_createAnimProxy:function(){var n=this._proxy=Q("div","leaflet-proxy leaflet-zoom-animated");this._panes.mapPane.appendChild(n),this.on("zoomanim",function(o){var c=$s,f=this._proxy.style[c];Ge(this._proxy,this.project(o.center,o.zoom),this.getZoomScale(o.zoom,1)),f===this._proxy.style[c]&&this._animatingZoom&&this._onZoomTransitionEnd()},this),this.on("load moveend",this._animMoveEnd,this),this._on("unload",this._destroyAnimProxy,this)},_destroyAnimProxy:function(){wt(this._proxy),this.off("load moveend",this._animMoveEnd,this),delete this._proxy},_animMoveEnd:function(){var n=this.getCenter(),o=this.getZoom();Ge(this._proxy,this.project(n,o),this.getZoomScale(o,1))},_catchTransitionEnd:function(n){this._animatingZoom&&n.propertyName.indexOf("transform")>=0&&this._onZoomTransitionEnd()},_nothingToAnimate:function(){return!this._container.getElementsByClassName("leaflet-zoom-animated").length},_tryAnimatedZoom:function(n,o,c){if(this._animatingZoom)return!0;if(c=c||{},!this._zoomAnimated||c.animate===!1||this._nothingToAnimate()||Math.abs(o-this._zoom)>this.options.zoomAnimationThreshold)return!1;var f=this.getZoomScale(o),S=this._getCenterOffset(n)._divideBy(1-1/f);return c.animate!==!0&&!this.getSize().contains(S)?!1:(k(function(){this._moveStart(!0,c.noMoveStart||!1)._animateZoom(n,o,!0)},this),!0)},_animateZoom:function(n,o,c,f){this._mapPane&&(c&&(this._animatingZoom=!0,this._animateToCenter=n,this._animateToZoom=o,It(this._mapPane,"leaflet-zoom-anim")),this.fire("zoomanim",{center:n,zoom:o,noUpdate:f}),this._tempFireZoomEvent||(this._tempFireZoomEvent=this._zoom!==this._animateToZoom),this._move(this._animateToCenter,this._animateToZoom,void 0,!0),setTimeout(l(this._onZoomTransitionEnd,this),250))},_onZoomTransitionEnd:function(){this._animatingZoom&&(this._mapPane&&$t(this._mapPane,"leaflet-zoom-anim"),this._animatingZoom=!1,this._move(this._animateToCenter,this._animateToZoom,void 0,!0),this._tempFireZoomEvent&&this.fire("zoom"),delete this._tempFireZoomEvent,this.fire("move"),this._moveEnd(!0))}});function fp(n,o){return new Se(n,o)}var oi=z.extend({options:{position:"topright"},initialize:function(n){w(this,n)},getPosition:function(){return this.options.position},setPosition:function(n){var o=this._map;return o&&o.removeControl(this),this.options.position=n,o&&o.addControl(this),this},getContainer:function(){return this._container},addTo:function(n){this.remove(),this._map=n;var o=this._container=this.onAdd(n),c=this.getPosition(),f=n._controlCorners[c];return It(o,"leaflet-control"),c.indexOf("bottom")!==-1?f.insertBefore(o,f.firstChild):f.appendChild(o),this._map.on("unload",this.remove,this),this},remove:function(){return this._map?(wt(this._container),this.onRemove&&this.onRemove(this._map),this._map.off("unload",this.remove,this),this._map=null,this):this},_refocusOnMap:function(n){this._map&&n&&n.screenX>0&&n.screenY>0&&this._map.getContainer().focus()}}),Nr=function(n){return new oi(n)};Se.include({addControl:function(n){return n.addTo(this),this},removeControl:function(n){return n.remove(),this},_initControlPos:function(){var n=this._controlCorners={},o="leaflet-",c=this._controlContainer=Q("div",o+"control-container",this._container);function f(S,C){var V=o+S+" "+o+C;n[S+C]=Q("div",V,c)}f("top","left"),f("top","right"),f("bottom","left"),f("bottom","right")},_clearControlPos:function(){for(var n in this._controlCorners)wt(this._controlCorners[n]);wt(this._controlContainer),delete this._controlCorners,delete this._controlContainer}});var Fh=oi.extend({options:{collapsed:!0,position:"topright",autoZIndex:!0,hideSingleBase:!1,sortLayers:!1,sortFunction:function(n,o,c,f){return c<f?-1:f<c?1:0}},initialize:function(n,o,c){w(this,c),this._layerControlInputs=[],this._layers=[],this._lastZIndex=0,this._handlingClick=!1,this._preventClick=!1;for(var f in n)this._addLayer(n[f],f);for(f in o)this._addLayer(o[f],f,!0)},onAdd:function(n){this._initLayout(),this._update(),this._map=n,n.on("zoomend",this._checkDisabledLayers,this);for(var o=0;o<this._layers.length;o++)this._layers[o].layer.on("add remove",this._onLayerChange,this);return this._container},addTo:function(n){return oi.prototype.addTo.call(this,n),this._expandIfNotCollapsed()},onRemove:function(){this._map.off("zoomend",this._checkDisabledLayers,this);for(var n=0;n<this._layers.length;n++)this._layers[n].layer.off("add remove",this._onLayerChange,this)},addBaseLayer:function(n,o){return this._addLayer(n,o),this._map?this._update():this},addOverlay:function(n,o){return this._addLayer(n,o,!0),this._map?this._update():this},removeLayer:function(n){n.off("add remove",this._onLayerChange,this);var o=this._getLayer(u(n));return o&&this._layers.splice(this._layers.indexOf(o),1),this._map?this._update():this},expand:function(){It(this._container,"leaflet-control-layers-expanded"),this._section.style.height=null;var n=this._map.getSize().y-(this._container.offsetTop+50);return n<this._section.clientHeight?(It(this._section,"leaflet-control-layers-scrollbar"),this._section.style.height=n+"px"):$t(this._section,"leaflet-control-layers-scrollbar"),this._checkDisabledLayers(),this},collapse:function(){return $t(this._container,"leaflet-control-layers-expanded"),this},_initLayout:function(){var n="leaflet-control-layers",o=this._container=Q("div",n),c=this.options.collapsed;o.setAttribute("aria-haspopup",!0),Dr(o),tl(o);var f=this._section=Q("section",n+"-list");c&&(this._map.on("click",this.collapse,this),ae(o,{mouseenter:this._expandSafely,mouseleave:this.collapse},this));var S=this._layersLink=Q("a",n+"-toggle",o);S.href="#",S.title="Layers",S.setAttribute("role","button"),ae(S,{keydown:function(C){C.keyCode===13&&this._expandSafely()},click:function(C){wn(C),this._expandSafely()}},this),c||this.expand(),this._baseLayersList=Q("div",n+"-base",f),this._separator=Q("div",n+"-separator",f),this._overlaysList=Q("div",n+"-overlays",f),o.appendChild(f)},_getLayer:function(n){for(var o=0;o<this._layers.length;o++)if(this._layers[o]&&u(this._layers[o].layer)===n)return this._layers[o]},_addLayer:function(n,o,c){this._map&&n.on("add remove",this._onLayerChange,this),this._layers.push({layer:n,name:o,overlay:c}),this.options.sortLayers&&this._layers.sort(l(function(f,S){return this.options.sortFunction(f.layer,S.layer,f.name,S.name)},this)),this.options.autoZIndex&&n.setZIndex&&(this._lastZIndex++,n.setZIndex(this._lastZIndex)),this._expandIfNotCollapsed()},_update:function(){if(!this._container)return this;Vt(this._baseLayersList),Vt(this._overlaysList),this._layerControlInputs=[];var n,o,c,f,S=0;for(c=0;c<this._layers.length;c++)f=this._layers[c],this._addItem(f),o=o||f.overlay,n=n||!f.overlay,S+=f.overlay?0:1;return this.options.hideSingleBase&&(n=n&&S>1,this._baseLayersList.style.display=n?"":"none"),this._separator.style.display=o&&n?"":"none",this},_onLayerChange:function(n){this._handlingClick||this._update();var o=this._getLayer(u(n.target)),c=o.overlay?n.type==="add"?"overlayadd":"overlayremove":n.type==="add"?"baselayerchange":null;c&&this._map.fire(c,o)},_createRadioElement:function(n,o){var c='<input type="radio" class="leaflet-control-layers-selector" name="'+n+'"'+(o?' checked="checked"':"")+"/>",f=document.createElement("div");return f.innerHTML=c,f.firstChild},_addItem:function(n){var o=document.createElement("label"),c=this._map.hasLayer(n.layer),f;n.overlay?(f=document.createElement("input"),f.type="checkbox",f.className="leaflet-control-layers-selector",f.defaultChecked=c):f=this._createRadioElement("leaflet-base-layers_"+u(this),c),this._layerControlInputs.push(f),f.layerId=u(n.layer),ae(f,"click",this._onInputClick,this);var S=document.createElement("span");S.innerHTML=" "+n.name;var C=document.createElement("span");o.appendChild(C),C.appendChild(f),C.appendChild(S);var V=n.overlay?this._overlaysList:this._baseLayersList;return V.appendChild(o),this._checkDisabledLayers(),o},_onInputClick:function(){if(!this._preventClick){var n=this._layerControlInputs,o,c,f=[],S=[];this._handlingClick=!0;for(var C=n.length-1;C>=0;C--)o=n[C],c=this._getLayer(o.layerId).layer,o.checked?f.push(c):o.checked||S.push(c);for(C=0;C<S.length;C++)this._map.hasLayer(S[C])&&this._map.removeLayer(S[C]);for(C=0;C<f.length;C++)this._map.hasLayer(f[C])||this._map.addLayer(f[C]);this._handlingClick=!1,this._refocusOnMap()}},_checkDisabledLayers:function(){for(var n=this._layerControlInputs,o,c,f=this._map.getZoom(),S=n.length-1;S>=0;S--)o=n[S],c=this._getLayer(o.layerId).layer,o.disabled=c.options.minZoom!==void 0&&f<c.options.minZoom||c.options.maxZoom!==void 0&&f>c.options.maxZoom},_expandIfNotCollapsed:function(){return this._map&&!this.options.collapsed&&this.expand(),this},_expandSafely:function(){var n=this._section;this._preventClick=!0,ae(n,"click",wn),this.expand();var o=this;setTimeout(function(){Be(n,"click",wn),o._preventClick=!1})}}),pp=function(n,o,c){return new Fh(n,o,c)},nl=oi.extend({options:{position:"topleft",zoomInText:'<span aria-hidden="true">+</span>',zoomInTitle:"Zoom in",zoomOutText:'<span aria-hidden="true">&#x2212;</span>',zoomOutTitle:"Zoom out"},onAdd:function(n){var o="leaflet-control-zoom",c=Q("div",o+" leaflet-bar"),f=this.options;return this._zoomInButton=this._createButton(f.zoomInText,f.zoomInTitle,o+"-in",c,this._zoomIn),this._zoomOutButton=this._createButton(f.zoomOutText,f.zoomOutTitle,o+"-out",c,this._zoomOut),this._updateDisabled(),n.on("zoomend zoomlevelschange",this._updateDisabled,this),c},onRemove:function(n){n.off("zoomend zoomlevelschange",this._updateDisabled,this)},disable:function(){return this._disabled=!0,this._updateDisabled(),this},enable:function(){return this._disabled=!1,this._updateDisabled(),this},_zoomIn:function(n){!this._disabled&&this._map._zoom<this._map.getMaxZoom()&&this._map.zoomIn(this._map.options.zoomDelta*(n.shiftKey?3:1))},_zoomOut:function(n){!this._disabled&&this._map._zoom>this._map.getMinZoom()&&this._map.zoomOut(this._map.options.zoomDelta*(n.shiftKey?3:1))},_createButton:function(n,o,c,f,S){var C=Q("a",c,f);return C.innerHTML=n,C.href="#",C.title=o,C.setAttribute("role","button"),C.setAttribute("aria-label",o),Dr(C),ae(C,"click",Es),ae(C,"click",S,this),ae(C,"click",this._refocusOnMap,this),C},_updateDisabled:function(){var n=this._map,o="leaflet-disabled";$t(this._zoomInButton,o),$t(this._zoomOutButton,o),this._zoomInButton.setAttribute("aria-disabled","false"),this._zoomOutButton.setAttribute("aria-disabled","false"),(this._disabled||n._zoom===n.getMinZoom())&&(It(this._zoomOutButton,o),this._zoomOutButton.setAttribute("aria-disabled","true")),(this._disabled||n._zoom===n.getMaxZoom())&&(It(this._zoomInButton,o),this._zoomInButton.setAttribute("aria-disabled","true"))}});Se.mergeOptions({zoomControl:!0}),Se.addInitHook(function(){this.options.zoomControl&&(this.zoomControl=new nl,this.addControl(this.zoomControl))});var mp=function(n){return new nl(n)},Uh=oi.extend({options:{position:"bottomleft",maxWidth:100,metric:!0,imperial:!0},onAdd:function(n){var o="leaflet-control-scale",c=Q("div",o),f=this.options;return this._addScales(f,o+"-line",c),n.on(f.updateWhenIdle?"moveend":"move",this._update,this),n.whenReady(this._update,this),c},onRemove:function(n){n.off(this.options.updateWhenIdle?"moveend":"move",this._update,this)},_addScales:function(n,o,c){n.metric&&(this._mScale=Q("div",o,c)),n.imperial&&(this._iScale=Q("div",o,c))},_update:function(){var n=this._map,o=n.getSize().y/2,c=n.distance(n.containerPointToLatLng([0,o]),n.containerPointToLatLng([this.options.maxWidth,o]));this._updateScales(c)},_updateScales:function(n){this.options.metric&&n&&this._updateMetric(n),this.options.imperial&&n&&this._updateImperial(n)},_updateMetric:function(n){var o=this._getRoundNum(n),c=o<1e3?o+" m":o/1e3+" km";this._updateScale(this._mScale,c,o/n)},_updateImperial:function(n){var o=n*3.2808399,c,f,S;o>5280?(c=o/5280,f=this._getRoundNum(c),this._updateScale(this._iScale,f+" mi",f/c)):(S=this._getRoundNum(o),this._updateScale(this._iScale,S+" ft",S/o))},_updateScale:function(n,o,c){n.style.width=Math.round(this.options.maxWidth*c)+"px",n.innerHTML=o},_getRoundNum:function(n){var o=Math.pow(10,(Math.floor(n)+"").length-1),c=n/o;return c=c>=10?10:c>=5?5:c>=3?3:c>=2?2:1,o*c}}),_p=function(n){return new Uh(n)},gp='<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" class="leaflet-attribution-flag"><path fill="#4C7BE1" d="M0 0h12v4H0z"/><path fill="#FFD500" d="M0 4h12v3H0z"/><path fill="#E0BC00" d="M0 7h12v1H0z"/></svg>',il=oi.extend({options:{position:"bottomright",prefix:'<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">'+(Lt.inlineSvg?gp+" ":"")+"Leaflet</a>"},initialize:function(n){w(this,n),this._attributions={}},onAdd:function(n){n.attributionControl=this,this._container=Q("div","leaflet-control-attribution"),Dr(this._container);for(var o in n._layers)n._layers[o].getAttribution&&this.addAttribution(n._layers[o].getAttribution());return this._update(),n.on("layeradd",this._addAttribution,this),this._container},onRemove:function(n){n.off("layeradd",this._addAttribution,this)},_addAttribution:function(n){n.layer.getAttribution&&(this.addAttribution(n.layer.getAttribution()),n.layer.once("remove",function(){this.removeAttribution(n.layer.getAttribution())},this))},setPrefix:function(n){return this.options.prefix=n,this._update(),this},addAttribution:function(n){return n?(this._attributions[n]||(this._attributions[n]=0),this._attributions[n]++,this._update(),this):this},removeAttribution:function(n){return n?(this._attributions[n]&&(this._attributions[n]--,this._update()),this):this},_update:function(){if(this._map){var n=[];for(var o in this._attributions)this._attributions[o]&&n.push(o);var c=[];this.options.prefix&&c.push(this.options.prefix),n.length&&c.push(n.join(", ")),this._container.innerHTML=c.join(' <span aria-hidden="true">|</span> ')}}});Se.mergeOptions({attributionControl:!0}),Se.addInitHook(function(){this.options.attributionControl&&new il().addTo(this)});var vp=function(n){return new il(n)};oi.Layers=Fh,oi.Zoom=nl,oi.Scale=Uh,oi.Attribution=il,Nr.layers=pp,Nr.zoom=mp,Nr.scale=_p,Nr.attribution=vp;var yi=z.extend({initialize:function(n){this._map=n},enable:function(){return this._enabled?this:(this._enabled=!0,this.addHooks(),this)},disable:function(){return this._enabled?(this._enabled=!1,this.removeHooks(),this):this},enabled:function(){return!!this._enabled}});yi.addTo=function(n,o){return n.addHandler(o,this),this};var xp={Events:rt},Oh=Lt.touch?"touchstart mousedown":"mousedown",is=$.extend({options:{clickTolerance:3},initialize:function(n,o,c,f){w(this,f),this._element=n,this._dragStartTarget=o||n,this._preventOutline=c},enable:function(){this._enabled||(ae(this._dragStartTarget,Oh,this._onDown,this),this._enabled=!0)},disable:function(){this._enabled&&(is._dragging===this&&this.finishDrag(!0),Be(this._dragStartTarget,Oh,this._onDown,this),this._enabled=!1,this._moved=!1)},_onDown:function(n){if(this._enabled&&(this._moved=!1,!Zt(this._element,"leaflet-zoom-anim"))){if(n.touches&&n.touches.length!==1){is._dragging===this&&this.finishDrag();return}if(!(is._dragging||n.shiftKey||n.which!==1&&n.button!==1&&!n.touches)&&(is._dragging=this,this._preventOutline&&In(this._element),Qn(),ge(),!this._moving)){this.fire("down");var o=n.touches?n.touches[0]:n,c=Ye(this._element);this._startPoint=new st(o.clientX,o.clientY),this._startPos=Xe(this._element),this._parentScale=Vn(c);var f=n.type==="mousedown";ae(document,f?"mousemove":"touchmove",this._onMove,this),ae(document,f?"mouseup":"touchend touchcancel",this._onUp,this)}}},_onMove:function(n){if(this._enabled){if(n.touches&&n.touches.length>1){this._moved=!0;return}var o=n.touches&&n.touches.length===1?n.touches[0]:n,c=new st(o.clientX,o.clientY)._subtract(this._startPoint);!c.x&&!c.y||Math.abs(c.x)+Math.abs(c.y)<this.options.clickTolerance||(c.x/=this._parentScale.x,c.y/=this._parentScale.y,wn(n),this._moved||(this.fire("dragstart"),this._moved=!0,It(document.body,"leaflet-dragging"),this._lastTarget=n.target||n.srcElement,window.SVGElementInstance&&this._lastTarget instanceof window.SVGElementInstance&&(this._lastTarget=this._lastTarget.correspondingUseElement),It(this._lastTarget,"leaflet-drag-target")),this._newPos=this._startPos.add(c),this._moving=!0,this._lastEvent=n,this._updatePosition())}},_updatePosition:function(){var n={originalEvent:this._lastEvent};this.fire("predrag",n),Nt(this._element,this._newPos),this.fire("drag",n)},_onUp:function(){this._enabled&&this.finishDrag()},finishDrag:function(n){$t(document.body,"leaflet-dragging"),this._lastTarget&&($t(this._lastTarget,"leaflet-drag-target"),this._lastTarget=null),Be(document,"mousemove touchmove",this._onMove,this),Be(document,"mouseup touchend touchcancel",this._onUp,this),ri(),Gn();var o=this._moved&&this._moving;this._moving=!1,is._dragging=!1,o&&this.fire("dragend",{noInertia:n,distance:this._newPos.distanceTo(this._startPos)})}});function zh(n,o,c){var f,S=[1,4,2,8],C,V,ut,ft,Et,Gt,ee,_e;for(C=0,Gt=n.length;C<Gt;C++)n[C]._code=Ts(n[C],o);for(ut=0;ut<4;ut++){for(ee=S[ut],f=[],C=0,Gt=n.length,V=Gt-1;C<Gt;V=C++)ft=n[C],Et=n[V],ft._code&ee?Et._code&ee||(_e=Ro(Et,ft,ee,o,c),_e._code=Ts(_e,o),f.push(_e)):(Et._code&ee&&(_e=Ro(Et,ft,ee,o,c),_e._code=Ts(_e,o),f.push(_e)),f.push(ft));n=f}return n}function Bh(n,o){var c,f,S,C,V,ut,ft,Et,Gt;if(!n||n.length===0)throw new Error("latlngs not passed");jn(n)||(console.warn("latlngs are not flat! Only the first ring will be used"),n=n[0]);var ee=yt([0,0]),_e=J(n),Dn=_e.getNorthWest().distanceTo(_e.getSouthWest())*_e.getNorthEast().distanceTo(_e.getNorthWest());Dn<1700&&(ee=sl(n));var pn=n.length,ti=[];for(c=0;c<pn;c++){var kn=yt(n[c]);ti.push(o.project(yt([kn.lat-ee.lat,kn.lng-ee.lng])))}for(ut=ft=Et=0,c=0,f=pn-1;c<pn;f=c++)S=ti[c],C=ti[f],V=S.y*C.x-C.y*S.x,ft+=(S.x+C.x)*V,Et+=(S.y+C.y)*V,ut+=V*3;ut===0?Gt=ti[0]:Gt=[ft/ut,Et/ut];var tr=o.unproject(Y(Gt));return yt([tr.lat+ee.lat,tr.lng+ee.lng])}function sl(n){for(var o=0,c=0,f=0,S=0;S<n.length;S++){var C=yt(n[S]);o+=C.lat,c+=C.lng,f++}return yt([o/f,c/f])}var Mp={__proto__:null,clipPolygon:zh,polygonCenter:Bh,centroid:sl};function kh(n,o){if(!o||!n.length)return n.slice();var c=o*o;return n=wp(n,c),n=Sp(n,c),n}function Hh(n,o,c){return Math.sqrt(Fr(n,o,c,!0))}function yp(n,o,c){return Fr(n,o,c)}function Sp(n,o){var c=n.length,f=typeof Uint8Array<"u"?Uint8Array:Array,S=new f(c);S[0]=S[c-1]=1,rl(n,S,o,0,c-1);var C,V=[];for(C=0;C<c;C++)S[C]&&V.push(n[C]);return V}function rl(n,o,c,f,S){var C=0,V,ut,ft;for(ut=f+1;ut<=S-1;ut++)ft=Fr(n[ut],n[f],n[S],!0),ft>C&&(V=ut,C=ft);C>c&&(o[V]=1,rl(n,o,c,f,V),rl(n,o,c,V,S))}function wp(n,o){for(var c=[n[0]],f=1,S=0,C=n.length;f<C;f++)bp(n[f],n[S])>o&&(c.push(n[f]),S=f);return S<C-1&&c.push(n[C-1]),c}var Gh;function Vh(n,o,c,f,S){var C=f?Gh:Ts(n,c),V=Ts(o,c),ut,ft,Et;for(Gh=V;;){if(!(C|V))return[n,o];if(C&V)return!1;ut=C||V,ft=Ro(n,o,ut,c,S),Et=Ts(ft,c),ut===C?(n=ft,C=Et):(o=ft,V=Et)}}function Ro(n,o,c,f,S){var C=o.x-n.x,V=o.y-n.y,ut=f.min,ft=f.max,Et,Gt;return c&8?(Et=n.x+C*(ft.y-n.y)/V,Gt=ft.y):c&4?(Et=n.x+C*(ut.y-n.y)/V,Gt=ut.y):c&2?(Et=ft.x,Gt=n.y+V*(ft.x-n.x)/C):c&1&&(Et=ut.x,Gt=n.y+V*(ut.x-n.x)/C),new st(Et,Gt,S)}function Ts(n,o){var c=0;return n.x<o.min.x?c|=1:n.x>o.max.x&&(c|=2),n.y<o.min.y?c|=4:n.y>o.max.y&&(c|=8),c}function bp(n,o){var c=o.x-n.x,f=o.y-n.y;return c*c+f*f}function Fr(n,o,c,f){var S=o.x,C=o.y,V=c.x-S,ut=c.y-C,ft=V*V+ut*ut,Et;return ft>0&&(Et=((n.x-S)*V+(n.y-C)*ut)/ft,Et>1?(S=c.x,C=c.y):Et>0&&(S+=V*Et,C+=ut*Et)),V=n.x-S,ut=n.y-C,f?V*V+ut*ut:new st(S,C)}function jn(n){return!I(n[0])||typeof n[0][0]!="object"&&typeof n[0][0]<"u"}function Wh(n){return console.warn("Deprecated use of _flat, please use L.LineUtil.isFlat instead."),jn(n)}function Xh(n,o){var c,f,S,C,V,ut,ft,Et;if(!n||n.length===0)throw new Error("latlngs not passed");jn(n)||(console.warn("latlngs are not flat! Only the first ring will be used"),n=n[0]);var Gt=yt([0,0]),ee=J(n),_e=ee.getNorthWest().distanceTo(ee.getSouthWest())*ee.getNorthEast().distanceTo(ee.getNorthWest());_e<1700&&(Gt=sl(n));var Dn=n.length,pn=[];for(c=0;c<Dn;c++){var ti=yt(n[c]);pn.push(o.project(yt([ti.lat-Gt.lat,ti.lng-Gt.lng])))}for(c=0,f=0;c<Dn-1;c++)f+=pn[c].distanceTo(pn[c+1])/2;if(f===0)Et=pn[0];else for(c=0,C=0;c<Dn-1;c++)if(V=pn[c],ut=pn[c+1],S=V.distanceTo(ut),C+=S,C>f){ft=(C-f)/S,Et=[ut.x-ft*(ut.x-V.x),ut.y-ft*(ut.y-V.y)];break}var kn=o.unproject(Y(Et));return yt([kn.lat+Gt.lat,kn.lng+Gt.lng])}var Ep={__proto__:null,simplify:kh,pointToSegmentDistance:Hh,closestPointOnSegment:yp,clipSegment:Vh,_getEdgeIntersection:Ro,_getBitCode:Ts,_sqClosestPointOnSegment:Fr,isFlat:jn,_flat:Wh,polylineCenter:Xh},ol={project:function(n){return new st(n.lng,n.lat)},unproject:function(n){return new Mt(n.y,n.x)},bounds:new lt([-180,-90],[180,90])},al={R:6378137,R_MINOR:6356752314245179e-9,bounds:new lt([-2003750834279e-5,-1549657073972e-5],[2003750834279e-5,1876465623138e-5]),project:function(n){var o=Math.PI/180,c=this.R,f=n.lat*o,S=this.R_MINOR/c,C=Math.sqrt(1-S*S),V=C*Math.sin(f),ut=Math.tan(Math.PI/4-f/2)/Math.pow((1-V)/(1+V),C/2);return f=-c*Math.log(Math.max(ut,1e-10)),new st(n.lng*o*c,f)},unproject:function(n){for(var o=180/Math.PI,c=this.R,f=this.R_MINOR/c,S=Math.sqrt(1-f*f),C=Math.exp(-n.y/c),V=Math.PI/2-2*Math.atan(C),ut=0,ft=.1,Et;ut<15&&Math.abs(ft)>1e-7;ut++)Et=S*Math.sin(V),Et=Math.pow((1-Et)/(1+Et),S/2),ft=Math.PI/2-2*Math.atan(C*Et)-V,V+=ft;return new Mt(V*o,n.x*o/c)}},Tp={__proto__:null,LonLat:ol,Mercator:al,SphericalMercator:we},Ap=r({},Rt,{code:"EPSG:3395",projection:al,transformation:(function(){var n=.5/(Math.PI*al.R);return fe(n,.5,-n,.5)})()}),Zh=r({},Rt,{code:"EPSG:4326",projection:ol,transformation:fe(1/180,1,-1/180,.5)}),Rp=r({},Wt,{projection:ol,transformation:fe(1,0,-1,0),scale:function(n){return Math.pow(2,n)},zoom:function(n){return Math.log(n)/Math.LN2},distance:function(n,o){var c=o.lng-n.lng,f=o.lat-n.lat;return Math.sqrt(c*c+f*f)},infinite:!0});Wt.Earth=Rt,Wt.EPSG3395=Ap,Wt.EPSG3857=ve,Wt.EPSG900913=ce,Wt.EPSG4326=Zh,Wt.Simple=Rp;var ai=$.extend({options:{pane:"overlayPane",attribution:null,bubblingMouseEvents:!0},addTo:function(n){return n.addLayer(this),this},remove:function(){return this.removeFrom(this._map||this._mapToAdd)},removeFrom:function(n){return n&&n.removeLayer(this),this},getPane:function(n){return this._map.getPane(n?this.options[n]||n:this.options.pane)},addInteractiveTarget:function(n){return this._map._targets[u(n)]=this,this},removeInteractiveTarget:function(n){return delete this._map._targets[u(n)],this},getAttribution:function(){return this.options.attribution},_layerAdd:function(n){var o=n.target;if(o.hasLayer(this)){if(this._map=o,this._zoomAnimated=o._zoomAnimated,this.getEvents){var c=this.getEvents();o.on(c,this),this.once("remove",function(){o.off(c,this)},this)}this.onAdd(o),this.fire("add"),o.fire("layeradd",{layer:this})}}});Se.include({addLayer:function(n){if(!n._layerAdd)throw new Error("The provided object is not a Layer.");var o=u(n);return this._layers[o]?this:(this._layers[o]=n,n._mapToAdd=this,n.beforeAdd&&n.beforeAdd(this),this.whenReady(n._layerAdd,n),this)},removeLayer:function(n){var o=u(n);return this._layers[o]?(this._loaded&&n.onRemove(this),delete this._layers[o],this._loaded&&(this.fire("layerremove",{layer:n}),n.fire("remove")),n._map=n._mapToAdd=null,this):this},hasLayer:function(n){return u(n)in this._layers},eachLayer:function(n,o){for(var c in this._layers)n.call(o,this._layers[c]);return this},_addLayers:function(n){n=n?I(n)?n:[n]:[];for(var o=0,c=n.length;o<c;o++)this.addLayer(n[o])},_addZoomLimit:function(n){(!isNaN(n.options.maxZoom)||!isNaN(n.options.minZoom))&&(this._zoomBoundLayers[u(n)]=n,this._updateZoomLevels())},_removeZoomLimit:function(n){var o=u(n);this._zoomBoundLayers[o]&&(delete this._zoomBoundLayers[o],this._updateZoomLevels())},_updateZoomLevels:function(){var n=1/0,o=-1/0,c=this._getZoomSpan();for(var f in this._zoomBoundLayers){var S=this._zoomBoundLayers[f].options;n=S.minZoom===void 0?n:Math.min(n,S.minZoom),o=S.maxZoom===void 0?o:Math.max(o,S.maxZoom)}this._layersMaxZoom=o===-1/0?void 0:o,this._layersMinZoom=n===1/0?void 0:n,c!==this._getZoomSpan()&&this.fire("zoomlevelschange"),this.options.maxZoom===void 0&&this._layersMaxZoom&&this.getZoom()>this._layersMaxZoom&&this.setZoom(this._layersMaxZoom),this.options.minZoom===void 0&&this._layersMinZoom&&this.getZoom()<this._layersMinZoom&&this.setZoom(this._layersMinZoom)}});var Ys=ai.extend({initialize:function(n,o){w(this,o),this._layers={};var c,f;if(n)for(c=0,f=n.length;c<f;c++)this.addLayer(n[c])},addLayer:function(n){var o=this.getLayerId(n);return this._layers[o]=n,this._map&&this._map.addLayer(n),this},removeLayer:function(n){var o=n in this._layers?n:this.getLayerId(n);return this._map&&this._layers[o]&&this._map.removeLayer(this._layers[o]),delete this._layers[o],this},hasLayer:function(n){var o=typeof n=="number"?n:this.getLayerId(n);return o in this._layers},clearLayers:function(){return this.eachLayer(this.removeLayer,this)},invoke:function(n){var o=Array.prototype.slice.call(arguments,1),c,f;for(c in this._layers)f=this._layers[c],f[n]&&f[n].apply(f,o);return this},onAdd:function(n){this.eachLayer(n.addLayer,n)},onRemove:function(n){this.eachLayer(n.removeLayer,n)},eachLayer:function(n,o){for(var c in this._layers)n.call(o,this._layers[c]);return this},getLayer:function(n){return this._layers[n]},getLayers:function(){var n=[];return this.eachLayer(n.push,n),n},setZIndex:function(n){return this.invoke("setZIndex",n)},getLayerId:function(n){return u(n)}}),Pp=function(n,o){return new Ys(n,o)},Ui=Ys.extend({addLayer:function(n){return this.hasLayer(n)?this:(n.addEventParent(this),Ys.prototype.addLayer.call(this,n),this.fire("layeradd",{layer:n}))},removeLayer:function(n){return this.hasLayer(n)?(n in this._layers&&(n=this._layers[n]),n.removeEventParent(this),Ys.prototype.removeLayer.call(this,n),this.fire("layerremove",{layer:n})):this},setStyle:function(n){return this.invoke("setStyle",n)},bringToFront:function(){return this.invoke("bringToFront")},bringToBack:function(){return this.invoke("bringToBack")},getBounds:function(){var n=new Dt;for(var o in this._layers){var c=this._layers[o];n.extend(c.getBounds?c.getBounds():c.getLatLng())}return n}}),Cp=function(n,o){return new Ui(n,o)},Ks=z.extend({options:{popupAnchor:[0,0],tooltipAnchor:[0,0],crossOrigin:!1},initialize:function(n){w(this,n)},createIcon:function(n){return this._createIcon("icon",n)},createShadow:function(n){return this._createIcon("shadow",n)},_createIcon:function(n,o){var c=this._getIconUrl(n);if(!c){if(n==="icon")throw new Error("iconUrl not set in Icon options (see the docs).");return null}var f=this._createImg(c,o&&o.tagName==="IMG"?o:null);return this._setIconStyles(f,n),(this.options.crossOrigin||this.options.crossOrigin==="")&&(f.crossOrigin=this.options.crossOrigin===!0?"":this.options.crossOrigin),f},_setIconStyles:function(n,o){var c=this.options,f=c[o+"Size"];typeof f=="number"&&(f=[f,f]);var S=Y(f),C=Y(o==="shadow"&&c.shadowAnchor||c.iconAnchor||S&&S.divideBy(2,!0));n.className="leaflet-marker-"+o+" "+(c.className||""),C&&(n.style.marginLeft=-C.x+"px",n.style.marginTop=-C.y+"px"),S&&(n.style.width=S.x+"px",n.style.height=S.y+"px")},_createImg:function(n,o){return o=o||document.createElement("img"),o.src=n,o},_getIconUrl:function(n){return Lt.retina&&this.options[n+"RetinaUrl"]||this.options[n+"Url"]}});function Lp(n){return new Ks(n)}var Ur=Ks.extend({options:{iconUrl:"marker-icon.png",iconRetinaUrl:"marker-icon-2x.png",shadowUrl:"marker-shadow.png",iconSize:[25,41],iconAnchor:[12,41],popupAnchor:[1,-34],tooltipAnchor:[16,-28],shadowSize:[41,41]},_getIconUrl:function(n){return typeof Ur.imagePath!="string"&&(Ur.imagePath=this._detectIconPath()),(this.options.imagePath||Ur.imagePath)+Ks.prototype._getIconUrl.call(this,n)},_stripUrl:function(n){var o=function(c,f,S){var C=f.exec(c);return C&&C[S]};return n=o(n,/^url\((['"])?(.+)\1\)$/,2),n&&o(n,/^(.*)marker-icon\.png$/,1)},_detectIconPath:function(){var n=Q("div","leaflet-default-icon-path",document.body),o=ct(n,"background-image")||ct(n,"backgroundImage");if(document.body.removeChild(n),o=this._stripUrl(o),o)return o;var c=document.querySelector('link[href$="leaflet.css"]');return c?c.href.substring(0,c.href.length-11-1):""}}),qh=yi.extend({initialize:function(n){this._marker=n},addHooks:function(){var n=this._marker._icon;this._draggable||(this._draggable=new is(n,n,!0)),this._draggable.on({dragstart:this._onDragStart,predrag:this._onPreDrag,drag:this._onDrag,dragend:this._onDragEnd},this).enable(),It(n,"leaflet-marker-draggable")},removeHooks:function(){this._draggable.off({dragstart:this._onDragStart,predrag:this._onPreDrag,drag:this._onDrag,dragend:this._onDragEnd},this).disable(),this._marker._icon&&$t(this._marker._icon,"leaflet-marker-draggable")},moved:function(){return this._draggable&&this._draggable._moved},_adjustPan:function(n){var o=this._marker,c=o._map,f=this._marker.options.autoPanSpeed,S=this._marker.options.autoPanPadding,C=Xe(o._icon),V=c.getPixelBounds(),ut=c.getPixelOrigin(),ft=St(V.min._subtract(ut).add(S),V.max._subtract(ut).subtract(S));if(!ft.contains(C)){var Et=Y((Math.max(ft.max.x,C.x)-ft.max.x)/(V.max.x-ft.max.x)-(Math.min(ft.min.x,C.x)-ft.min.x)/(V.min.x-ft.min.x),(Math.max(ft.max.y,C.y)-ft.max.y)/(V.max.y-ft.max.y)-(Math.min(ft.min.y,C.y)-ft.min.y)/(V.min.y-ft.min.y)).multiplyBy(f);c.panBy(Et,{animate:!1}),this._draggable._newPos._add(Et),this._draggable._startPos._add(Et),Nt(o._icon,this._draggable._newPos),this._onDrag(n),this._panRequest=k(this._adjustPan.bind(this,n))}},_onDragStart:function(){this._oldLatLng=this._marker.getLatLng(),this._marker.closePopup&&this._marker.closePopup(),this._marker.fire("movestart").fire("dragstart")},_onPreDrag:function(n){this._marker.options.autoPan&&(G(this._panRequest),this._panRequest=k(this._adjustPan.bind(this,n)))},_onDrag:function(n){var o=this._marker,c=o._shadow,f=Xe(o._icon),S=o._map.layerPointToLatLng(f);c&&Nt(c,f),o._latlng=S,n.latlng=S,n.oldLatLng=this._oldLatLng,o.fire("move",n).fire("drag",n)},_onDragEnd:function(n){G(this._panRequest),delete this._oldLatLng,this._marker.fire("moveend").fire("dragend",n)}}),Po=ai.extend({options:{icon:new Ur,interactive:!0,keyboard:!0,title:"",alt:"Marker",zIndexOffset:0,opacity:1,riseOnHover:!1,riseOffset:250,pane:"markerPane",shadowPane:"shadowPane",bubblingMouseEvents:!1,autoPanOnFocus:!0,draggable:!1,autoPan:!1,autoPanPadding:[50,50],autoPanSpeed:10},initialize:function(n,o){w(this,o),this._latlng=yt(n)},onAdd:function(n){this._zoomAnimated=this._zoomAnimated&&n.options.markerZoomAnimation,this._zoomAnimated&&n.on("zoomanim",this._animateZoom,this),this._initIcon(),this.update()},onRemove:function(n){this.dragging&&this.dragging.enabled()&&(this.options.draggable=!0,this.dragging.removeHooks()),delete this.dragging,this._zoomAnimated&&n.off("zoomanim",this._animateZoom,this),this._removeIcon(),this._removeShadow()},getEvents:function(){return{zoom:this.update,viewreset:this.update}},getLatLng:function(){return this._latlng},setLatLng:function(n){var o=this._latlng;return this._latlng=yt(n),this.update(),this.fire("move",{oldLatLng:o,latlng:this._latlng})},setZIndexOffset:function(n){return this.options.zIndexOffset=n,this.update()},getIcon:function(){return this.options.icon},setIcon:function(n){return this.options.icon=n,this._map&&(this._initIcon(),this.update()),this._popup&&this.bindPopup(this._popup,this._popup.options),this},getElement:function(){return this._icon},update:function(){if(this._icon&&this._map){var n=this._map.latLngToLayerPoint(this._latlng).round();this._setPos(n)}return this},_initIcon:function(){var n=this.options,o="leaflet-zoom-"+(this._zoomAnimated?"animated":"hide"),c=n.icon.createIcon(this._icon),f=!1;c!==this._icon&&(this._icon&&this._removeIcon(),f=!0,n.title&&(c.title=n.title),c.tagName==="IMG"&&(c.alt=n.alt||"")),It(c,o),n.keyboard&&(c.tabIndex="0",c.setAttribute("role","button")),this._icon=c,n.riseOnHover&&this.on({mouseover:this._bringToFront,mouseout:this._resetZIndex}),this.options.autoPanOnFocus&&ae(c,"focus",this._panOnFocus,this);var S=n.icon.createShadow(this._shadow),C=!1;S!==this._shadow&&(this._removeShadow(),C=!0),S&&(It(S,o),S.alt=""),this._shadow=S,n.opacity<1&&this._updateOpacity(),f&&this.getPane().appendChild(this._icon),this._initInteraction(),S&&C&&this.getPane(n.shadowPane).appendChild(this._shadow)},_removeIcon:function(){this.options.riseOnHover&&this.off({mouseover:this._bringToFront,mouseout:this._resetZIndex}),this.options.autoPanOnFocus&&Be(this._icon,"focus",this._panOnFocus,this),wt(this._icon),this.removeInteractiveTarget(this._icon),this._icon=null},_removeShadow:function(){this._shadow&&wt(this._shadow),this._shadow=null},_setPos:function(n){this._icon&&Nt(this._icon,n),this._shadow&&Nt(this._shadow,n),this._zIndex=n.y+this.options.zIndexOffset,this._resetZIndex()},_updateZIndex:function(n){this._icon&&(this._icon.style.zIndex=this._zIndex+n)},_animateZoom:function(n){var o=this._map._latLngToNewLayerPoint(this._latlng,n.zoom,n.center).round();this._setPos(o)},_initInteraction:function(){if(this.options.interactive&&(It(this._icon,"leaflet-interactive"),this.addInteractiveTarget(this._icon),qh)){var n=this.options.draggable;this.dragging&&(n=this.dragging.enabled(),this.dragging.disable()),this.dragging=new qh(this),n&&this.dragging.enable()}},setOpacity:function(n){return this.options.opacity=n,this._map&&this._updateOpacity(),this},_updateOpacity:function(){var n=this.options.opacity;this._icon&&be(this._icon,n),this._shadow&&be(this._shadow,n)},_bringToFront:function(){this._updateZIndex(this.options.riseOffset)},_resetZIndex:function(){this._updateZIndex(0)},_panOnFocus:function(){var n=this._map;if(n){var o=this.options.icon.options,c=o.iconSize?Y(o.iconSize):Y(0,0),f=o.iconAnchor?Y(o.iconAnchor):Y(0,0);n.panInside(this._latlng,{paddingTopLeft:f,paddingBottomRight:c.subtract(f)})}},_getPopupAnchor:function(){return this.options.icon.options.popupAnchor},_getTooltipAnchor:function(){return this.options.icon.options.tooltipAnchor}});function Ip(n,o){return new Po(n,o)}var ss=ai.extend({options:{stroke:!0,color:"#3388ff",weight:3,opacity:1,lineCap:"round",lineJoin:"round",dashArray:null,dashOffset:null,fill:!1,fillColor:null,fillOpacity:.2,fillRule:"evenodd",interactive:!0,bubblingMouseEvents:!0},beforeAdd:function(n){this._renderer=n.getRenderer(this)},onAdd:function(){this._renderer._initPath(this),this._reset(),this._renderer._addPath(this)},onRemove:function(){this._renderer._removePath(this)},redraw:function(){return this._map&&this._renderer._updatePath(this),this},setStyle:function(n){return w(this,n),this._renderer&&(this._renderer._updateStyle(this),this.options.stroke&&n&&Object.prototype.hasOwnProperty.call(n,"weight")&&this._updateBounds()),this},bringToFront:function(){return this._renderer&&this._renderer._bringToFront(this),this},bringToBack:function(){return this._renderer&&this._renderer._bringToBack(this),this},getElement:function(){return this._path},_reset:function(){this._project(),this._update()},_clickTolerance:function(){return(this.options.stroke?this.options.weight/2:0)+(this._renderer.options.tolerance||0)}}),Co=ss.extend({options:{fill:!0,radius:10},initialize:function(n,o){w(this,o),this._latlng=yt(n),this._radius=this.options.radius},setLatLng:function(n){var o=this._latlng;return this._latlng=yt(n),this.redraw(),this.fire("move",{oldLatLng:o,latlng:this._latlng})},getLatLng:function(){return this._latlng},setRadius:function(n){return this.options.radius=this._radius=n,this.redraw()},getRadius:function(){return this._radius},setStyle:function(n){var o=n&&n.radius||this._radius;return ss.prototype.setStyle.call(this,n),this.setRadius(o),this},_project:function(){this._point=this._map.latLngToLayerPoint(this._latlng),this._updateBounds()},_updateBounds:function(){var n=this._radius,o=this._radiusY||n,c=this._clickTolerance(),f=[n+c,o+c];this._pxBounds=new lt(this._point.subtract(f),this._point.add(f))},_update:function(){this._map&&this._updatePath()},_updatePath:function(){this._renderer._updateCircle(this)},_empty:function(){return this._radius&&!this._renderer._bounds.intersects(this._pxBounds)},_containsPoint:function(n){return n.distanceTo(this._point)<=this._radius+this._clickTolerance()}});function Dp(n,o){return new Co(n,o)}var ll=Co.extend({initialize:function(n,o,c){if(typeof o=="number"&&(o=r({},c,{radius:o})),w(this,o),this._latlng=yt(n),isNaN(this.options.radius))throw new Error("Circle radius cannot be NaN");this._mRadius=this.options.radius},setRadius:function(n){return this._mRadius=n,this.redraw()},getRadius:function(){return this._mRadius},getBounds:function(){var n=[this._radius,this._radiusY||this._radius];return new Dt(this._map.layerPointToLatLng(this._point.subtract(n)),this._map.layerPointToLatLng(this._point.add(n)))},setStyle:ss.prototype.setStyle,_project:function(){var n=this._latlng.lng,o=this._latlng.lat,c=this._map,f=c.options.crs;if(f.distance===Rt.distance){var S=Math.PI/180,C=this._mRadius/Rt.R/S,V=c.project([o+C,n]),ut=c.project([o-C,n]),ft=V.add(ut).divideBy(2),Et=c.unproject(ft).lat,Gt=Math.acos((Math.cos(C*S)-Math.sin(o*S)*Math.sin(Et*S))/(Math.cos(o*S)*Math.cos(Et*S)))/S;(isNaN(Gt)||Gt===0)&&(Gt=C/Math.cos(Math.PI/180*o)),this._point=ft.subtract(c.getPixelOrigin()),this._radius=isNaN(Gt)?0:ft.x-c.project([Et,n-Gt]).x,this._radiusY=ft.y-V.y}else{var ee=f.unproject(f.project(this._latlng).subtract([this._mRadius,0]));this._point=c.latLngToLayerPoint(this._latlng),this._radius=this._point.x-c.latLngToLayerPoint(ee).x}this._updateBounds()}});function Np(n,o,c){return new ll(n,o,c)}var Oi=ss.extend({options:{smoothFactor:1,noClip:!1},initialize:function(n,o){w(this,o),this._setLatLngs(n)},getLatLngs:function(){return this._latlngs},setLatLngs:function(n){return this._setLatLngs(n),this.redraw()},isEmpty:function(){return!this._latlngs.length},closestLayerPoint:function(n){for(var o=1/0,c=null,f=Fr,S,C,V=0,ut=this._parts.length;V<ut;V++)for(var ft=this._parts[V],Et=1,Gt=ft.length;Et<Gt;Et++){S=ft[Et-1],C=ft[Et];var ee=f(n,S,C,!0);ee<o&&(o=ee,c=f(n,S,C))}return c&&(c.distance=Math.sqrt(o)),c},getCenter:function(){if(!this._map)throw new Error("Must add layer to map before using getCenter()");return Xh(this._defaultShape(),this._map.options.crs)},getBounds:function(){return this._bounds},addLatLng:function(n,o){return o=o||this._defaultShape(),n=yt(n),o.push(n),this._bounds.extend(n),this.redraw()},_setLatLngs:function(n){this._bounds=new Dt,this._latlngs=this._convertLatLngs(n)},_defaultShape:function(){return jn(this._latlngs)?this._latlngs:this._latlngs[0]},_convertLatLngs:function(n){for(var o=[],c=jn(n),f=0,S=n.length;f<S;f++)c?(o[f]=yt(n[f]),this._bounds.extend(o[f])):o[f]=this._convertLatLngs(n[f]);return o},_project:function(){var n=new lt;this._rings=[],this._projectLatlngs(this._latlngs,this._rings,n),this._bounds.isValid()&&n.isValid()&&(this._rawPxBounds=n,this._updateBounds())},_updateBounds:function(){var n=this._clickTolerance(),o=new st(n,n);this._rawPxBounds&&(this._pxBounds=new lt([this._rawPxBounds.min.subtract(o),this._rawPxBounds.max.add(o)]))},_projectLatlngs:function(n,o,c){var f=n[0]instanceof Mt,S=n.length,C,V;if(f){for(V=[],C=0;C<S;C++)V[C]=this._map.latLngToLayerPoint(n[C]),c.extend(V[C]);o.push(V)}else for(C=0;C<S;C++)this._projectLatlngs(n[C],o,c)},_clipPoints:function(){var n=this._renderer._bounds;if(this._parts=[],!(!this._pxBounds||!this._pxBounds.intersects(n))){if(this.options.noClip){this._parts=this._rings;return}var o=this._parts,c,f,S,C,V,ut,ft;for(c=0,S=0,C=this._rings.length;c<C;c++)for(ft=this._rings[c],f=0,V=ft.length;f<V-1;f++)ut=Vh(ft[f],ft[f+1],n,f,!0),ut&&(o[S]=o[S]||[],o[S].push(ut[0]),(ut[1]!==ft[f+1]||f===V-2)&&(o[S].push(ut[1]),S++))}},_simplifyPoints:function(){for(var n=this._parts,o=this.options.smoothFactor,c=0,f=n.length;c<f;c++)n[c]=kh(n[c],o)},_update:function(){this._map&&(this._clipPoints(),this._simplifyPoints(),this._updatePath())},_updatePath:function(){this._renderer._updatePoly(this)},_containsPoint:function(n,o){var c,f,S,C,V,ut,ft=this._clickTolerance();if(!this._pxBounds||!this._pxBounds.contains(n))return!1;for(c=0,C=this._parts.length;c<C;c++)for(ut=this._parts[c],f=0,V=ut.length,S=V-1;f<V;S=f++)if(!(!o&&f===0)&&Hh(n,ut[S],ut[f])<=ft)return!0;return!1}});function Fp(n,o){return new Oi(n,o)}Oi._flat=Wh;var Js=Oi.extend({options:{fill:!0},isEmpty:function(){return!this._latlngs.length||!this._latlngs[0].length},getCenter:function(){if(!this._map)throw new Error("Must add layer to map before using getCenter()");return Bh(this._defaultShape(),this._map.options.crs)},_convertLatLngs:function(n){var o=Oi.prototype._convertLatLngs.call(this,n),c=o.length;return c>=2&&o[0]instanceof Mt&&o[0].equals(o[c-1])&&o.pop(),o},_setLatLngs:function(n){Oi.prototype._setLatLngs.call(this,n),jn(this._latlngs)&&(this._latlngs=[this._latlngs])},_defaultShape:function(){return jn(this._latlngs[0])?this._latlngs[0]:this._latlngs[0][0]},_clipPoints:function(){var n=this._renderer._bounds,o=this.options.weight,c=new st(o,o);if(n=new lt(n.min.subtract(c),n.max.add(c)),this._parts=[],!(!this._pxBounds||!this._pxBounds.intersects(n))){if(this.options.noClip){this._parts=this._rings;return}for(var f=0,S=this._rings.length,C;f<S;f++)C=zh(this._rings[f],n,!0),C.length&&this._parts.push(C)}},_updatePath:function(){this._renderer._updatePoly(this,!0)},_containsPoint:function(n){var o=!1,c,f,S,C,V,ut,ft,Et;if(!this._pxBounds||!this._pxBounds.contains(n))return!1;for(C=0,ft=this._parts.length;C<ft;C++)for(c=this._parts[C],V=0,Et=c.length,ut=Et-1;V<Et;ut=V++)f=c[V],S=c[ut],f.y>n.y!=S.y>n.y&&n.x<(S.x-f.x)*(n.y-f.y)/(S.y-f.y)+f.x&&(o=!o);return o||Oi.prototype._containsPoint.call(this,n,!0)}});function Up(n,o){return new Js(n,o)}var zi=Ui.extend({initialize:function(n,o){w(this,o),this._layers={},n&&this.addData(n)},addData:function(n){var o=I(n)?n:n.features,c,f,S;if(o){for(c=0,f=o.length;c<f;c++)S=o[c],(S.geometries||S.geometry||S.features||S.coordinates)&&this.addData(S);return this}var C=this.options;if(C.filter&&!C.filter(n))return this;var V=Lo(n,C);return V?(V.feature=No(n),V.defaultOptions=V.options,this.resetStyle(V),C.onEachFeature&&C.onEachFeature(n,V),this.addLayer(V)):this},resetStyle:function(n){return n===void 0?this.eachLayer(this.resetStyle,this):(n.options=r({},n.defaultOptions),this._setLayerStyle(n,this.options.style),this)},setStyle:function(n){return this.eachLayer(function(o){this._setLayerStyle(o,n)},this)},_setLayerStyle:function(n,o){n.setStyle&&(typeof o=="function"&&(o=o(n.feature)),n.setStyle(o))}});function Lo(n,o){var c=n.type==="Feature"?n.geometry:n,f=c?c.coordinates:null,S=[],C=o&&o.pointToLayer,V=o&&o.coordsToLatLng||cl,ut,ft,Et,Gt;if(!f&&!c)return null;switch(c.type){case"Point":return ut=V(f),$h(C,n,ut,o);case"MultiPoint":for(Et=0,Gt=f.length;Et<Gt;Et++)ut=V(f[Et]),S.push($h(C,n,ut,o));return new Ui(S);case"LineString":case"MultiLineString":return ft=Io(f,c.type==="LineString"?0:1,V),new Oi(ft,o);case"Polygon":case"MultiPolygon":return ft=Io(f,c.type==="Polygon"?1:2,V),new Js(ft,o);case"GeometryCollection":for(Et=0,Gt=c.geometries.length;Et<Gt;Et++){var ee=Lo({geometry:c.geometries[Et],type:"Feature",properties:n.properties},o);ee&&S.push(ee)}return new Ui(S);case"FeatureCollection":for(Et=0,Gt=c.features.length;Et<Gt;Et++){var _e=Lo(c.features[Et],o);_e&&S.push(_e)}return new Ui(S);default:throw new Error("Invalid GeoJSON object.")}}function $h(n,o,c,f){return n?n(o,c):new Po(c,f&&f.markersInheritOptions&&f)}function cl(n){return new Mt(n[1],n[0],n[2])}function Io(n,o,c){for(var f=[],S=0,C=n.length,V;S<C;S++)V=o?Io(n[S],o-1,c):(c||cl)(n[S]),f.push(V);return f}function hl(n,o){return n=yt(n),n.alt!==void 0?[p(n.lng,o),p(n.lat,o),p(n.alt,o)]:[p(n.lng,o),p(n.lat,o)]}function Do(n,o,c,f){for(var S=[],C=0,V=n.length;C<V;C++)S.push(o?Do(n[C],jn(n[C])?0:o-1,c,f):hl(n[C],f));return!o&&c&&S.length>0&&S.push(S[0].slice()),S}function Qs(n,o){return n.feature?r({},n.feature,{geometry:o}):No(o)}function No(n){return n.type==="Feature"||n.type==="FeatureCollection"?n:{type:"Feature",properties:{},geometry:n}}var ul={toGeoJSON:function(n){return Qs(this,{type:"Point",coordinates:hl(this.getLatLng(),n)})}};Po.include(ul),ll.include(ul),Co.include(ul),Oi.include({toGeoJSON:function(n){var o=!jn(this._latlngs),c=Do(this._latlngs,o?1:0,!1,n);return Qs(this,{type:(o?"Multi":"")+"LineString",coordinates:c})}}),Js.include({toGeoJSON:function(n){var o=!jn(this._latlngs),c=o&&!jn(this._latlngs[0]),f=Do(this._latlngs,c?2:o?1:0,!0,n);return o||(f=[f]),Qs(this,{type:(c?"Multi":"")+"Polygon",coordinates:f})}}),Ys.include({toMultiPoint:function(n){var o=[];return this.eachLayer(function(c){o.push(c.toGeoJSON(n).geometry.coordinates)}),Qs(this,{type:"MultiPoint",coordinates:o})},toGeoJSON:function(n){var o=this.feature&&this.feature.geometry&&this.feature.geometry.type;if(o==="MultiPoint")return this.toMultiPoint(n);var c=o==="GeometryCollection",f=[];return this.eachLayer(function(S){if(S.toGeoJSON){var C=S.toGeoJSON(n);if(c)f.push(C.geometry);else{var V=No(C);V.type==="FeatureCollection"?f.push.apply(f,V.features):f.push(V)}}}),c?Qs(this,{geometries:f,type:"GeometryCollection"}):{type:"FeatureCollection",features:f}}});function Yh(n,o){return new zi(n,o)}var Op=Yh,Fo=ai.extend({options:{opacity:1,alt:"",interactive:!1,crossOrigin:!1,errorOverlayUrl:"",zIndex:1,className:""},initialize:function(n,o,c){this._url=n,this._bounds=J(o),w(this,c)},onAdd:function(){this._image||(this._initImage(),this.options.opacity<1&&this._updateOpacity()),this.options.interactive&&(It(this._image,"leaflet-interactive"),this.addInteractiveTarget(this._image)),this.getPane().appendChild(this._image),this._reset()},onRemove:function(){wt(this._image),this.options.interactive&&this.removeInteractiveTarget(this._image)},setOpacity:function(n){return this.options.opacity=n,this._image&&this._updateOpacity(),this},setStyle:function(n){return n.opacity&&this.setOpacity(n.opacity),this},bringToFront:function(){return this._map&&At(this._image),this},bringToBack:function(){return this._map&&Ut(this._image),this},setUrl:function(n){return this._url=n,this._image&&(this._image.src=n),this},setBounds:function(n){return this._bounds=J(n),this._map&&this._reset(),this},getEvents:function(){var n={zoom:this._reset,viewreset:this._reset};return this._zoomAnimated&&(n.zoomanim=this._animateZoom),n},setZIndex:function(n){return this.options.zIndex=n,this._updateZIndex(),this},getBounds:function(){return this._bounds},getElement:function(){return this._image},_initImage:function(){var n=this._url.tagName==="IMG",o=this._image=n?this._url:Q("img");if(It(o,"leaflet-image-layer"),this._zoomAnimated&&It(o,"leaflet-zoom-animated"),this.options.className&&It(o,this.options.className),o.onselectstart=_,o.onmousemove=_,o.onload=l(this.fire,this,"load"),o.onerror=l(this._overlayOnError,this,"error"),(this.options.crossOrigin||this.options.crossOrigin==="")&&(o.crossOrigin=this.options.crossOrigin===!0?"":this.options.crossOrigin),this.options.zIndex&&this._updateZIndex(),n){this._url=o.src;return}o.src=this._url,o.alt=this.options.alt},_animateZoom:function(n){var o=this._map.getZoomScale(n.zoom),c=this._map._latLngBoundsToNewLayerBounds(this._bounds,n.zoom,n.center).min;Ge(this._image,c,o)},_reset:function(){var n=this._image,o=new lt(this._map.latLngToLayerPoint(this._bounds.getNorthWest()),this._map.latLngToLayerPoint(this._bounds.getSouthEast())),c=o.getSize();Nt(n,o.min),n.style.width=c.x+"px",n.style.height=c.y+"px"},_updateOpacity:function(){be(this._image,this.options.opacity)},_updateZIndex:function(){this._image&&this.options.zIndex!==void 0&&this.options.zIndex!==null&&(this._image.style.zIndex=this.options.zIndex)},_overlayOnError:function(){this.fire("error");var n=this.options.errorOverlayUrl;n&&this._url!==n&&(this._url=n,this._image.src=n)},getCenter:function(){return this._bounds.getCenter()}}),zp=function(n,o,c){return new Fo(n,o,c)},Kh=Fo.extend({options:{autoplay:!0,loop:!0,keepAspectRatio:!0,muted:!1,playsInline:!0},_initImage:function(){var n=this._url.tagName==="VIDEO",o=this._image=n?this._url:Q("video");if(It(o,"leaflet-image-layer"),this._zoomAnimated&&It(o,"leaflet-zoom-animated"),this.options.className&&It(o,this.options.className),o.onselectstart=_,o.onmousemove=_,o.onloadeddata=l(this.fire,this,"load"),n){for(var c=o.getElementsByTagName("source"),f=[],S=0;S<c.length;S++)f.push(c[S].src);this._url=c.length>0?f:[o.src];return}I(this._url)||(this._url=[this._url]),!this.options.keepAspectRatio&&Object.prototype.hasOwnProperty.call(o.style,"objectFit")&&(o.style.objectFit="fill"),o.autoplay=!!this.options.autoplay,o.loop=!!this.options.loop,o.muted=!!this.options.muted,o.playsInline=!!this.options.playsInline;for(var C=0;C<this._url.length;C++){var V=Q("source");V.src=this._url[C],o.appendChild(V)}}});function Bp(n,o,c){return new Kh(n,o,c)}var Jh=Fo.extend({_initImage:function(){var n=this._image=this._url;It(n,"leaflet-image-layer"),this._zoomAnimated&&It(n,"leaflet-zoom-animated"),this.options.className&&It(n,this.options.className),n.onselectstart=_,n.onmousemove=_}});function kp(n,o,c){return new Jh(n,o,c)}var Si=ai.extend({options:{interactive:!1,offset:[0,0],className:"",pane:void 0,content:""},initialize:function(n,o){n&&(n instanceof Mt||I(n))?(this._latlng=yt(n),w(this,o)):(w(this,n),this._source=o),this.options.content&&(this._content=this.options.content)},openOn:function(n){return n=arguments.length?n:this._source._map,n.hasLayer(this)||n.addLayer(this),this},close:function(){return this._map&&this._map.removeLayer(this),this},toggle:function(n){return this._map?this.close():(arguments.length?this._source=n:n=this._source,this._prepareOpen(),this.openOn(n._map)),this},onAdd:function(n){this._zoomAnimated=n._zoomAnimated,this._container||this._initLayout(),n._fadeAnimated&&be(this._container,0),clearTimeout(this._removeTimeout),this.getPane().appendChild(this._container),this.update(),n._fadeAnimated&&be(this._container,1),this.bringToFront(),this.options.interactive&&(It(this._container,"leaflet-interactive"),this.addInteractiveTarget(this._container))},onRemove:function(n){n._fadeAnimated?(be(this._container,0),this._removeTimeout=setTimeout(l(wt,void 0,this._container),200)):wt(this._container),this.options.interactive&&($t(this._container,"leaflet-interactive"),this.removeInteractiveTarget(this._container))},getLatLng:function(){return this._latlng},setLatLng:function(n){return this._latlng=yt(n),this._map&&(this._updatePosition(),this._adjustPan()),this},getContent:function(){return this._content},setContent:function(n){return this._content=n,this.update(),this},getElement:function(){return this._container},update:function(){this._map&&(this._container.style.visibility="hidden",this._updateContent(),this._updateLayout(),this._updatePosition(),this._container.style.visibility="",this._adjustPan())},getEvents:function(){var n={zoom:this._updatePosition,viewreset:this._updatePosition};return this._zoomAnimated&&(n.zoomanim=this._animateZoom),n},isOpen:function(){return!!this._map&&this._map.hasLayer(this)},bringToFront:function(){return this._map&&At(this._container),this},bringToBack:function(){return this._map&&Ut(this._container),this},_prepareOpen:function(n){var o=this._source;if(!o._map)return!1;if(o instanceof Ui){o=null;var c=this._source._layers;for(var f in c)if(c[f]._map){o=c[f];break}if(!o)return!1;this._source=o}if(!n)if(o.getCenter)n=o.getCenter();else if(o.getLatLng)n=o.getLatLng();else if(o.getBounds)n=o.getBounds().getCenter();else throw new Error("Unable to get source layer LatLng.");return this.setLatLng(n),this._map&&this.update(),!0},_updateContent:function(){if(this._content){var n=this._contentNode,o=typeof this._content=="function"?this._content(this._source||this):this._content;if(typeof o=="string")n.innerHTML=o;else{for(;n.hasChildNodes();)n.removeChild(n.firstChild);n.appendChild(o)}this.fire("contentupdate")}},_updatePosition:function(){if(this._map){var n=this._map.latLngToLayerPoint(this._latlng),o=Y(this.options.offset),c=this._getAnchor();this._zoomAnimated?Nt(this._container,n.add(c)):o=o.add(n).add(c);var f=this._containerBottom=-o.y,S=this._containerLeft=-Math.round(this._containerWidth/2)+o.x;this._container.style.bottom=f+"px",this._container.style.left=S+"px"}},_getAnchor:function(){return[0,0]}});Se.include({_initOverlay:function(n,o,c,f){var S=o;return S instanceof n||(S=new n(f).setContent(o)),c&&S.setLatLng(c),S}}),ai.include({_initOverlay:function(n,o,c,f){var S=c;return S instanceof n?(w(S,f),S._source=this):(S=o&&!f?o:new n(f,this),S.setContent(c)),S}});var Uo=Si.extend({options:{pane:"popupPane",offset:[0,7],maxWidth:300,minWidth:50,maxHeight:null,autoPan:!0,autoPanPaddingTopLeft:null,autoPanPaddingBottomRight:null,autoPanPadding:[5,5],keepInView:!1,closeButton:!0,autoClose:!0,closeOnEscapeKey:!0,className:""},openOn:function(n){return n=arguments.length?n:this._source._map,!n.hasLayer(this)&&n._popup&&n._popup.options.autoClose&&n.removeLayer(n._popup),n._popup=this,Si.prototype.openOn.call(this,n)},onAdd:function(n){Si.prototype.onAdd.call(this,n),n.fire("popupopen",{popup:this}),this._source&&(this._source.fire("popupopen",{popup:this},!0),this._source instanceof ss||this._source.on("preclick",bs))},onRemove:function(n){Si.prototype.onRemove.call(this,n),n.fire("popupclose",{popup:this}),this._source&&(this._source.fire("popupclose",{popup:this},!0),this._source instanceof ss||this._source.off("preclick",bs))},getEvents:function(){var n=Si.prototype.getEvents.call(this);return(this.options.closeOnClick!==void 0?this.options.closeOnClick:this._map.options.closePopupOnClick)&&(n.preclick=this.close),this.options.keepInView&&(n.moveend=this._adjustPan),n},_initLayout:function(){var n="leaflet-popup",o=this._container=Q("div",n+" "+(this.options.className||"")+" leaflet-zoom-animated"),c=this._wrapper=Q("div",n+"-content-wrapper",o);if(this._contentNode=Q("div",n+"-content",c),Dr(o),tl(this._contentNode),ae(o,"contextmenu",bs),this._tipContainer=Q("div",n+"-tip-container",o),this._tip=Q("div",n+"-tip",this._tipContainer),this.options.closeButton){var f=this._closeButton=Q("a",n+"-close-button",o);f.setAttribute("role","button"),f.setAttribute("aria-label","Close popup"),f.href="#close",f.innerHTML='<span aria-hidden="true">&#215;</span>',ae(f,"click",function(S){wn(S),this.close()},this)}},_updateLayout:function(){var n=this._contentNode,o=n.style;o.width="",o.whiteSpace="nowrap";var c=n.offsetWidth;c=Math.min(c,this.options.maxWidth),c=Math.max(c,this.options.minWidth),o.width=c+1+"px",o.whiteSpace="",o.height="";var f=n.offsetHeight,S=this.options.maxHeight,C="leaflet-popup-scrolled";S&&f>S?(o.height=S+"px",It(n,C)):$t(n,C),this._containerWidth=this._container.offsetWidth},_animateZoom:function(n){var o=this._map._latLngToNewLayerPoint(this._latlng,n.zoom,n.center),c=this._getAnchor();Nt(this._container,o.add(c))},_adjustPan:function(){if(this.options.autoPan){if(this._map._panAnim&&this._map._panAnim.stop(),this._autopanning){this._autopanning=!1;return}var n=this._map,o=parseInt(ct(this._container,"marginBottom"),10)||0,c=this._container.offsetHeight+o,f=this._containerWidth,S=new st(this._containerLeft,-c-this._containerBottom);S._add(Xe(this._container));var C=n.layerPointToContainerPoint(S),V=Y(this.options.autoPanPadding),ut=Y(this.options.autoPanPaddingTopLeft||V),ft=Y(this.options.autoPanPaddingBottomRight||V),Et=n.getSize(),Gt=0,ee=0;C.x+f+ft.x>Et.x&&(Gt=C.x+f-Et.x+ft.x),C.x-Gt-ut.x<0&&(Gt=C.x-ut.x),C.y+c+ft.y>Et.y&&(ee=C.y+c-Et.y+ft.y),C.y-ee-ut.y<0&&(ee=C.y-ut.y),(Gt||ee)&&(this.options.keepInView&&(this._autopanning=!0),n.fire("autopanstart").panBy([Gt,ee]))}},_getAnchor:function(){return Y(this._source&&this._source._getPopupAnchor?this._source._getPopupAnchor():[0,0])}}),Hp=function(n,o){return new Uo(n,o)};Se.mergeOptions({closePopupOnClick:!0}),Se.include({openPopup:function(n,o,c){return this._initOverlay(Uo,n,o,c).openOn(this),this},closePopup:function(n){return n=arguments.length?n:this._popup,n&&n.close(),this}}),ai.include({bindPopup:function(n,o){return this._popup=this._initOverlay(Uo,this._popup,n,o),this._popupHandlersAdded||(this.on({click:this._openPopup,keypress:this._onKeyPress,remove:this.closePopup,move:this._movePopup}),this._popupHandlersAdded=!0),this},unbindPopup:function(){return this._popup&&(this.off({click:this._openPopup,keypress:this._onKeyPress,remove:this.closePopup,move:this._movePopup}),this._popupHandlersAdded=!1,this._popup=null),this},openPopup:function(n){return this._popup&&(this instanceof Ui||(this._popup._source=this),this._popup._prepareOpen(n||this._latlng)&&this._popup.openOn(this._map)),this},closePopup:function(){return this._popup&&this._popup.close(),this},togglePopup:function(){return this._popup&&this._popup.toggle(this),this},isPopupOpen:function(){return this._popup?this._popup.isOpen():!1},setPopupContent:function(n){return this._popup&&this._popup.setContent(n),this},getPopup:function(){return this._popup},_openPopup:function(n){if(!(!this._popup||!this._map)){Es(n);var o=n.layer||n.target;if(this._popup._source===o&&!(o instanceof ss)){this._map.hasLayer(this._popup)?this.closePopup():this.openPopup(n.latlng);return}this._popup._source=o,this.openPopup(n.latlng)}},_movePopup:function(n){this._popup.setLatLng(n.latlng)},_onKeyPress:function(n){n.originalEvent.keyCode===13&&this._openPopup(n)}});var Oo=Si.extend({options:{pane:"tooltipPane",offset:[0,0],direction:"auto",permanent:!1,sticky:!1,opacity:.9},onAdd:function(n){Si.prototype.onAdd.call(this,n),this.setOpacity(this.options.opacity),n.fire("tooltipopen",{tooltip:this}),this._source&&(this.addEventParent(this._source),this._source.fire("tooltipopen",{tooltip:this},!0))},onRemove:function(n){Si.prototype.onRemove.call(this,n),n.fire("tooltipclose",{tooltip:this}),this._source&&(this.removeEventParent(this._source),this._source.fire("tooltipclose",{tooltip:this},!0))},getEvents:function(){var n=Si.prototype.getEvents.call(this);return this.options.permanent||(n.preclick=this.close),n},_initLayout:function(){var n="leaflet-tooltip",o=n+" "+(this.options.className||"")+" leaflet-zoom-"+(this._zoomAnimated?"animated":"hide");this._contentNode=this._container=Q("div",o),this._container.setAttribute("role","tooltip"),this._container.setAttribute("id","leaflet-tooltip-"+u(this))},_updateLayout:function(){},_adjustPan:function(){},_setPosition:function(n){var o,c,f=this._map,S=this._container,C=f.latLngToContainerPoint(f.getCenter()),V=f.layerPointToContainerPoint(n),ut=this.options.direction,ft=S.offsetWidth,Et=S.offsetHeight,Gt=Y(this.options.offset),ee=this._getAnchor();ut==="top"?(o=ft/2,c=Et):ut==="bottom"?(o=ft/2,c=0):ut==="center"?(o=ft/2,c=Et/2):ut==="right"?(o=0,c=Et/2):ut==="left"?(o=ft,c=Et/2):V.x<C.x?(ut="right",o=0,c=Et/2):(ut="left",o=ft+(Gt.x+ee.x)*2,c=Et/2),n=n.subtract(Y(o,c,!0)).add(Gt).add(ee),$t(S,"leaflet-tooltip-right"),$t(S,"leaflet-tooltip-left"),$t(S,"leaflet-tooltip-top"),$t(S,"leaflet-tooltip-bottom"),It(S,"leaflet-tooltip-"+ut),Nt(S,n)},_updatePosition:function(){var n=this._map.latLngToLayerPoint(this._latlng);this._setPosition(n)},setOpacity:function(n){this.options.opacity=n,this._container&&be(this._container,n)},_animateZoom:function(n){var o=this._map._latLngToNewLayerPoint(this._latlng,n.zoom,n.center);this._setPosition(o)},_getAnchor:function(){return Y(this._source&&this._source._getTooltipAnchor&&!this.options.sticky?this._source._getTooltipAnchor():[0,0])}}),Gp=function(n,o){return new Oo(n,o)};Se.include({openTooltip:function(n,o,c){return this._initOverlay(Oo,n,o,c).openOn(this),this},closeTooltip:function(n){return n.close(),this}}),ai.include({bindTooltip:function(n,o){return this._tooltip&&this.isTooltipOpen()&&this.unbindTooltip(),this._tooltip=this._initOverlay(Oo,this._tooltip,n,o),this._initTooltipInteractions(),this._tooltip.options.permanent&&this._map&&this._map.hasLayer(this)&&this.openTooltip(),this},unbindTooltip:function(){return this._tooltip&&(this._initTooltipInteractions(!0),this.closeTooltip(),this._tooltip=null),this},_initTooltipInteractions:function(n){if(!(!n&&this._tooltipHandlersAdded)){var o=n?"off":"on",c={remove:this.closeTooltip,move:this._moveTooltip};this._tooltip.options.permanent?c.add=this._openTooltip:(c.mouseover=this._openTooltip,c.mouseout=this.closeTooltip,c.click=this._openTooltip,this._map?this._addFocusListeners():c.add=this._addFocusListeners),this._tooltip.options.sticky&&(c.mousemove=this._moveTooltip),this[o](c),this._tooltipHandlersAdded=!n}},openTooltip:function(n){return this._tooltip&&(this instanceof Ui||(this._tooltip._source=this),this._tooltip._prepareOpen(n)&&(this._tooltip.openOn(this._map),this.getElement?this._setAriaDescribedByOnLayer(this):this.eachLayer&&this.eachLayer(this._setAriaDescribedByOnLayer,this))),this},closeTooltip:function(){if(this._tooltip)return this._tooltip.close()},toggleTooltip:function(){return this._tooltip&&this._tooltip.toggle(this),this},isTooltipOpen:function(){return this._tooltip.isOpen()},setTooltipContent:function(n){return this._tooltip&&this._tooltip.setContent(n),this},getTooltip:function(){return this._tooltip},_addFocusListeners:function(){this.getElement?this._addFocusListenersOnLayer(this):this.eachLayer&&this.eachLayer(this._addFocusListenersOnLayer,this)},_addFocusListenersOnLayer:function(n){var o=typeof n.getElement=="function"&&n.getElement();o&&(ae(o,"focus",function(){this._tooltip._source=n,this.openTooltip()},this),ae(o,"blur",this.closeTooltip,this))},_setAriaDescribedByOnLayer:function(n){var o=typeof n.getElement=="function"&&n.getElement();o&&o.setAttribute("aria-describedby",this._tooltip._container.id)},_openTooltip:function(n){if(!(!this._tooltip||!this._map)){if(this._map.dragging&&this._map.dragging.moving()&&!this._openOnceFlag){this._openOnceFlag=!0;var o=this;this._map.once("moveend",function(){o._openOnceFlag=!1,o._openTooltip(n)});return}this._tooltip._source=n.layer||n.target,this.openTooltip(this._tooltip.options.sticky?n.latlng:void 0)}},_moveTooltip:function(n){var o=n.latlng,c,f;this._tooltip.options.sticky&&n.originalEvent&&(c=this._map.mouseEventToContainerPoint(n.originalEvent),f=this._map.containerPointToLayerPoint(c),o=this._map.layerPointToLatLng(f)),this._tooltip.setLatLng(o)}});var Qh=Ks.extend({options:{iconSize:[12,12],html:!1,bgPos:null,className:"leaflet-div-icon"},createIcon:function(n){var o=n&&n.tagName==="DIV"?n:document.createElement("div"),c=this.options;if(c.html instanceof Element?(Vt(o),o.appendChild(c.html)):o.innerHTML=c.html!==!1?c.html:"",c.bgPos){var f=Y(c.bgPos);o.style.backgroundPosition=-f.x+"px "+-f.y+"px"}return this._setIconStyles(o,"icon"),o},createShadow:function(){return null}});function Vp(n){return new Qh(n)}Ks.Default=Ur;var Or=ai.extend({options:{tileSize:256,opacity:1,updateWhenIdle:Lt.mobile,updateWhenZooming:!0,updateInterval:200,zIndex:1,bounds:null,minZoom:0,maxZoom:void 0,maxNativeZoom:void 0,minNativeZoom:void 0,noWrap:!1,pane:"tilePane",className:"",keepBuffer:2},initialize:function(n){w(this,n)},onAdd:function(){this._initContainer(),this._levels={},this._tiles={},this._resetView()},beforeAdd:function(n){n._addZoomLimit(this)},onRemove:function(n){this._removeAllTiles(),wt(this._container),n._removeZoomLimit(this),this._container=null,this._tileZoom=void 0},bringToFront:function(){return this._map&&(At(this._container),this._setAutoZIndex(Math.max)),this},bringToBack:function(){return this._map&&(Ut(this._container),this._setAutoZIndex(Math.min)),this},getContainer:function(){return this._container},setOpacity:function(n){return this.options.opacity=n,this._updateOpacity(),this},setZIndex:function(n){return this.options.zIndex=n,this._updateZIndex(),this},isLoading:function(){return this._loading},redraw:function(){if(this._map){this._removeAllTiles();var n=this._clampZoom(this._map.getZoom());n!==this._tileZoom&&(this._tileZoom=n,this._updateLevels()),this._update()}return this},getEvents:function(){var n={viewprereset:this._invalidateAll,viewreset:this._resetView,zoom:this._resetView,moveend:this._onMoveEnd};return this.options.updateWhenIdle||(this._onMove||(this._onMove=d(this._onMoveEnd,this.options.updateInterval,this)),n.move=this._onMove),this._zoomAnimated&&(n.zoomanim=this._animateZoom),n},createTile:function(){return document.createElement("div")},getTileSize:function(){var n=this.options.tileSize;return n instanceof st?n:new st(n,n)},_updateZIndex:function(){this._container&&this.options.zIndex!==void 0&&this.options.zIndex!==null&&(this._container.style.zIndex=this.options.zIndex)},_setAutoZIndex:function(n){for(var o=this.getPane().children,c=-n(-1/0,1/0),f=0,S=o.length,C;f<S;f++)C=o[f].style.zIndex,o[f]!==this._container&&C&&(c=n(c,+C));isFinite(c)&&(this.options.zIndex=c+n(-1,1),this._updateZIndex())},_updateOpacity:function(){if(this._map&&!Lt.ielt9){be(this._container,this.options.opacity);var n=+new Date,o=!1,c=!1;for(var f in this._tiles){var S=this._tiles[f];if(!(!S.current||!S.loaded)){var C=Math.min(1,(n-S.loaded)/200);be(S.el,C),C<1?o=!0:(S.active?c=!0:this._onOpaqueTile(S),S.active=!0)}}c&&!this._noPrune&&this._pruneTiles(),o&&(G(this._fadeFrame),this._fadeFrame=k(this._updateOpacity,this))}},_onOpaqueTile:_,_initContainer:function(){this._container||(this._container=Q("div","leaflet-layer "+(this.options.className||"")),this._updateZIndex(),this.options.opacity<1&&this._updateOpacity(),this.getPane().appendChild(this._container))},_updateLevels:function(){var n=this._tileZoom,o=this.options.maxZoom;if(n!==void 0){for(var c in this._levels)c=Number(c),this._levels[c].el.children.length||c===n?(this._levels[c].el.style.zIndex=o-Math.abs(n-c),this._onUpdateLevel(c)):(wt(this._levels[c].el),this._removeTilesAtZoom(c),this._onRemoveLevel(c),delete this._levels[c]);var f=this._levels[n],S=this._map;return f||(f=this._levels[n]={},f.el=Q("div","leaflet-tile-container leaflet-zoom-animated",this._container),f.el.style.zIndex=o,f.origin=S.project(S.unproject(S.getPixelOrigin()),n).round(),f.zoom=n,this._setZoomTransform(f,S.getCenter(),S.getZoom()),_(f.el.offsetWidth),this._onCreateLevel(f)),this._level=f,f}},_onUpdateLevel:_,_onRemoveLevel:_,_onCreateLevel:_,_pruneTiles:function(){if(this._map){var n,o,c=this._map.getZoom();if(c>this.options.maxZoom||c<this.options.minZoom){this._removeAllTiles();return}for(n in this._tiles)o=this._tiles[n],o.retain=o.current;for(n in this._tiles)if(o=this._tiles[n],o.current&&!o.active){var f=o.coords;this._retainParent(f.x,f.y,f.z,f.z-5)||this._retainChildren(f.x,f.y,f.z,f.z+2)}for(n in this._tiles)this._tiles[n].retain||this._removeTile(n)}},_removeTilesAtZoom:function(n){for(var o in this._tiles)this._tiles[o].coords.z===n&&this._removeTile(o)},_removeAllTiles:function(){for(var n in this._tiles)this._removeTile(n)},_invalidateAll:function(){for(var n in this._levels)wt(this._levels[n].el),this._onRemoveLevel(Number(n)),delete this._levels[n];this._removeAllTiles(),this._tileZoom=void 0},_retainParent:function(n,o,c,f){var S=Math.floor(n/2),C=Math.floor(o/2),V=c-1,ut=new st(+S,+C);ut.z=+V;var ft=this._tileCoordsToKey(ut),Et=this._tiles[ft];return Et&&Et.active?(Et.retain=!0,!0):(Et&&Et.loaded&&(Et.retain=!0),V>f?this._retainParent(S,C,V,f):!1)},_retainChildren:function(n,o,c,f){for(var S=2*n;S<2*n+2;S++)for(var C=2*o;C<2*o+2;C++){var V=new st(S,C);V.z=c+1;var ut=this._tileCoordsToKey(V),ft=this._tiles[ut];if(ft&&ft.active){ft.retain=!0;continue}else ft&&ft.loaded&&(ft.retain=!0);c+1<f&&this._retainChildren(S,C,c+1,f)}},_resetView:function(n){var o=n&&(n.pinch||n.flyTo);this._setView(this._map.getCenter(),this._map.getZoom(),o,o)},_animateZoom:function(n){this._setView(n.center,n.zoom,!0,n.noUpdate)},_clampZoom:function(n){var o=this.options;return o.minNativeZoom!==void 0&&n<o.minNativeZoom?o.minNativeZoom:o.maxNativeZoom!==void 0&&o.maxNativeZoom<n?o.maxNativeZoom:n},_setView:function(n,o,c,f){var S=Math.round(o);this.options.maxZoom!==void 0&&S>this.options.maxZoom||this.options.minZoom!==void 0&&S<this.options.minZoom?S=void 0:S=this._clampZoom(S);var C=this.options.updateWhenZooming&&S!==this._tileZoom;(!f||C)&&(this._tileZoom=S,this._abortLoading&&this._abortLoading(),this._updateLevels(),this._resetGrid(),S!==void 0&&this._update(n),c||this._pruneTiles(),this._noPrune=!!c),this._setZoomTransforms(n,o)},_setZoomTransforms:function(n,o){for(var c in this._levels)this._setZoomTransform(this._levels[c],n,o)},_setZoomTransform:function(n,o,c){var f=this._map.getZoomScale(c,n.zoom),S=n.origin.multiplyBy(f).subtract(this._map._getNewPixelOrigin(o,c)).round();Lt.any3d?Ge(n.el,S,f):Nt(n.el,S)},_resetGrid:function(){var n=this._map,o=n.options.crs,c=this._tileSize=this.getTileSize(),f=this._tileZoom,S=this._map.getPixelWorldBounds(this._tileZoom);S&&(this._globalTileRange=this._pxBoundsToTileRange(S)),this._wrapX=o.wrapLng&&!this.options.noWrap&&[Math.floor(n.project([0,o.wrapLng[0]],f).x/c.x),Math.ceil(n.project([0,o.wrapLng[1]],f).x/c.y)],this._wrapY=o.wrapLat&&!this.options.noWrap&&[Math.floor(n.project([o.wrapLat[0],0],f).y/c.x),Math.ceil(n.project([o.wrapLat[1],0],f).y/c.y)]},_onMoveEnd:function(){!this._map||this._map._animatingZoom||this._update()},_getTiledPixelBounds:function(n){var o=this._map,c=o._animatingZoom?Math.max(o._animateToZoom,o.getZoom()):o.getZoom(),f=o.getZoomScale(c,this._tileZoom),S=o.project(n,this._tileZoom).floor(),C=o.getSize().divideBy(f*2);return new lt(S.subtract(C),S.add(C))},_update:function(n){var o=this._map;if(o){var c=this._clampZoom(o.getZoom());if(n===void 0&&(n=o.getCenter()),this._tileZoom!==void 0){var f=this._getTiledPixelBounds(n),S=this._pxBoundsToTileRange(f),C=S.getCenter(),V=[],ut=this.options.keepBuffer,ft=new lt(S.getBottomLeft().subtract([ut,-ut]),S.getTopRight().add([ut,-ut]));if(!(isFinite(S.min.x)&&isFinite(S.min.y)&&isFinite(S.max.x)&&isFinite(S.max.y)))throw new Error("Attempted to load an infinite number of tiles");for(var Et in this._tiles){var Gt=this._tiles[Et].coords;(Gt.z!==this._tileZoom||!ft.contains(new st(Gt.x,Gt.y)))&&(this._tiles[Et].current=!1)}if(Math.abs(c-this._tileZoom)>1){this._setView(n,c);return}for(var ee=S.min.y;ee<=S.max.y;ee++)for(var _e=S.min.x;_e<=S.max.x;_e++){var Dn=new st(_e,ee);if(Dn.z=this._tileZoom,!!this._isValidTile(Dn)){var pn=this._tiles[this._tileCoordsToKey(Dn)];pn?pn.current=!0:V.push(Dn)}}if(V.sort(function(kn,tr){return kn.distanceTo(C)-tr.distanceTo(C)}),V.length!==0){this._loading||(this._loading=!0,this.fire("loading"));var ti=document.createDocumentFragment();for(_e=0;_e<V.length;_e++)this._addTile(V[_e],ti);this._level.el.appendChild(ti)}}}},_isValidTile:function(n){var o=this._map.options.crs;if(!o.infinite){var c=this._globalTileRange;if(!o.wrapLng&&(n.x<c.min.x||n.x>c.max.x)||!o.wrapLat&&(n.y<c.min.y||n.y>c.max.y))return!1}if(!this.options.bounds)return!0;var f=this._tileCoordsToBounds(n);return J(this.options.bounds).overlaps(f)},_keyToBounds:function(n){return this._tileCoordsToBounds(this._keyToTileCoords(n))},_tileCoordsToNwSe:function(n){var o=this._map,c=this.getTileSize(),f=n.scaleBy(c),S=f.add(c),C=o.unproject(f,n.z),V=o.unproject(S,n.z);return[C,V]},_tileCoordsToBounds:function(n){var o=this._tileCoordsToNwSe(n),c=new Dt(o[0],o[1]);return this.options.noWrap||(c=this._map.wrapLatLngBounds(c)),c},_tileCoordsToKey:function(n){return n.x+":"+n.y+":"+n.z},_keyToTileCoords:function(n){var o=n.split(":"),c=new st(+o[0],+o[1]);return c.z=+o[2],c},_removeTile:function(n){var o=this._tiles[n];o&&(wt(o.el),delete this._tiles[n],this.fire("tileunload",{tile:o.el,coords:this._keyToTileCoords(n)}))},_initTile:function(n){It(n,"leaflet-tile");var o=this.getTileSize();n.style.width=o.x+"px",n.style.height=o.y+"px",n.onselectstart=_,n.onmousemove=_,Lt.ielt9&&this.options.opacity<1&&be(n,this.options.opacity)},_addTile:function(n,o){var c=this._getTilePos(n),f=this._tileCoordsToKey(n),S=this.createTile(this._wrapCoords(n),l(this._tileReady,this,n));this._initTile(S),this.createTile.length<2&&k(l(this._tileReady,this,n,null,S)),Nt(S,c),this._tiles[f]={el:S,coords:n,current:!0},o.appendChild(S),this.fire("tileloadstart",{tile:S,coords:n})},_tileReady:function(n,o,c){o&&this.fire("tileerror",{error:o,tile:c,coords:n});var f=this._tileCoordsToKey(n);c=this._tiles[f],c&&(c.loaded=+new Date,this._map._fadeAnimated?(be(c.el,0),G(this._fadeFrame),this._fadeFrame=k(this._updateOpacity,this)):(c.active=!0,this._pruneTiles()),o||(It(c.el,"leaflet-tile-loaded"),this.fire("tileload",{tile:c.el,coords:n})),this._noTilesToLoad()&&(this._loading=!1,this.fire("load"),Lt.ielt9||!this._map._fadeAnimated?k(this._pruneTiles,this):setTimeout(l(this._pruneTiles,this),250)))},_getTilePos:function(n){return n.scaleBy(this.getTileSize()).subtract(this._level.origin)},_wrapCoords:function(n){var o=new st(this._wrapX?m(n.x,this._wrapX):n.x,this._wrapY?m(n.y,this._wrapY):n.y);return o.z=n.z,o},_pxBoundsToTileRange:function(n){var o=this.getTileSize();return new lt(n.min.unscaleBy(o).floor(),n.max.unscaleBy(o).ceil().subtract([1,1]))},_noTilesToLoad:function(){for(var n in this._tiles)if(!this._tiles[n].loaded)return!1;return!0}});function Wp(n){return new Or(n)}var js=Or.extend({options:{minZoom:0,maxZoom:18,subdomains:"abc",errorTileUrl:"",zoomOffset:0,tms:!1,zoomReverse:!1,detectRetina:!1,crossOrigin:!1,referrerPolicy:!1},initialize:function(n,o){this._url=n,o=w(this,o),o.detectRetina&&Lt.retina&&o.maxZoom>0?(o.tileSize=Math.floor(o.tileSize/2),o.zoomReverse?(o.zoomOffset--,o.minZoom=Math.min(o.maxZoom,o.minZoom+1)):(o.zoomOffset++,o.maxZoom=Math.max(o.minZoom,o.maxZoom-1)),o.minZoom=Math.max(0,o.minZoom)):o.zoomReverse?o.minZoom=Math.min(o.maxZoom,o.minZoom):o.maxZoom=Math.max(o.minZoom,o.maxZoom),typeof o.subdomains=="string"&&(o.subdomains=o.subdomains.split("")),this.on("tileunload",this._onTileRemove)},setUrl:function(n,o){return this._url===n&&o===void 0&&(o=!0),this._url=n,o||this.redraw(),this},createTile:function(n,o){var c=document.createElement("img");return ae(c,"load",l(this._tileOnLoad,this,o,c)),ae(c,"error",l(this._tileOnError,this,o,c)),(this.options.crossOrigin||this.options.crossOrigin==="")&&(c.crossOrigin=this.options.crossOrigin===!0?"":this.options.crossOrigin),typeof this.options.referrerPolicy=="string"&&(c.referrerPolicy=this.options.referrerPolicy),c.alt="",c.src=this.getTileUrl(n),c},getTileUrl:function(n){var o={r:Lt.retina?"@2x":"",s:this._getSubdomain(n),x:n.x,y:n.y,z:this._getZoomForUrl()};if(this._map&&!this._map.options.crs.infinite){var c=this._globalTileRange.max.y-n.y;this.options.tms&&(o.y=c),o["-y"]=c}return b(this._url,r(o,this.options))},_tileOnLoad:function(n,o){Lt.ielt9?setTimeout(l(n,this,null,o),0):n(null,o)},_tileOnError:function(n,o,c){var f=this.options.errorTileUrl;f&&o.getAttribute("src")!==f&&(o.src=f),n(c,o)},_onTileRemove:function(n){n.tile.onload=null},_getZoomForUrl:function(){var n=this._tileZoom,o=this.options.maxZoom,c=this.options.zoomReverse,f=this.options.zoomOffset;return c&&(n=o-n),n+f},_getSubdomain:function(n){var o=Math.abs(n.x+n.y)%this.options.subdomains.length;return this.options.subdomains[o]},_abortLoading:function(){var n,o;for(n in this._tiles)if(this._tiles[n].coords.z!==this._tileZoom&&(o=this._tiles[n].el,o.onload=_,o.onerror=_,!o.complete)){o.src=D;var c=this._tiles[n].coords;wt(o),delete this._tiles[n],this.fire("tileabort",{tile:o,coords:c})}},_removeTile:function(n){var o=this._tiles[n];if(o)return o.el.setAttribute("src",D),Or.prototype._removeTile.call(this,n)},_tileReady:function(n,o,c){if(!(!this._map||c&&c.getAttribute("src")===D))return Or.prototype._tileReady.call(this,n,o,c)}});function jh(n,o){return new js(n,o)}var tu=js.extend({defaultWmsParams:{service:"WMS",request:"GetMap",layers:"",styles:"",format:"image/jpeg",transparent:!1,version:"1.1.1"},options:{crs:null,uppercase:!1},initialize:function(n,o){this._url=n;var c=r({},this.defaultWmsParams);for(var f in o)f in this.options||(c[f]=o[f]);o=w(this,o);var S=o.detectRetina&&Lt.retina?2:1,C=this.getTileSize();c.width=C.x*S,c.height=C.y*S,this.wmsParams=c},onAdd:function(n){this._crs=this.options.crs||n.options.crs,this._wmsVersion=parseFloat(this.wmsParams.version);var o=this._wmsVersion>=1.3?"crs":"srs";this.wmsParams[o]=this._crs.code,js.prototype.onAdd.call(this,n)},getTileUrl:function(n){var o=this._tileCoordsToNwSe(n),c=this._crs,f=St(c.project(o[0]),c.project(o[1])),S=f.min,C=f.max,V=(this._wmsVersion>=1.3&&this._crs===Zh?[S.y,S.x,C.y,C.x]:[S.x,S.y,C.x,C.y]).join(","),ut=js.prototype.getTileUrl.call(this,n);return ut+M(this.wmsParams,ut,this.options.uppercase)+(this.options.uppercase?"&BBOX=":"&bbox=")+V},setParams:function(n,o){return r(this.wmsParams,n),o||this.redraw(),this}});function Xp(n,o){return new tu(n,o)}js.WMS=tu,jh.wms=Xp;var Bi=ai.extend({options:{padding:.1},initialize:function(n){w(this,n),u(this),this._layers=this._layers||{}},onAdd:function(){this._container||(this._initContainer(),It(this._container,"leaflet-zoom-animated")),this.getPane().appendChild(this._container),this._update(),this.on("update",this._updatePaths,this)},onRemove:function(){this.off("update",this._updatePaths,this),this._destroyContainer()},getEvents:function(){var n={viewreset:this._reset,zoom:this._onZoom,moveend:this._update,zoomend:this._onZoomEnd};return this._zoomAnimated&&(n.zoomanim=this._onAnimZoom),n},_onAnimZoom:function(n){this._updateTransform(n.center,n.zoom)},_onZoom:function(){this._updateTransform(this._map.getCenter(),this._map.getZoom())},_updateTransform:function(n,o){var c=this._map.getZoomScale(o,this._zoom),f=this._map.getSize().multiplyBy(.5+this.options.padding),S=this._map.project(this._center,o),C=f.multiplyBy(-c).add(S).subtract(this._map._getNewPixelOrigin(n,o));Lt.any3d?Ge(this._container,C,c):Nt(this._container,C)},_reset:function(){this._update(),this._updateTransform(this._center,this._zoom);for(var n in this._layers)this._layers[n]._reset()},_onZoomEnd:function(){for(var n in this._layers)this._layers[n]._project()},_updatePaths:function(){for(var n in this._layers)this._layers[n]._update()},_update:function(){var n=this.options.padding,o=this._map.getSize(),c=this._map.containerPointToLayerPoint(o.multiplyBy(-n)).round();this._bounds=new lt(c,c.add(o.multiplyBy(1+n*2)).round()),this._center=this._map.getCenter(),this._zoom=this._map.getZoom()}}),eu=Bi.extend({options:{tolerance:0},getEvents:function(){var n=Bi.prototype.getEvents.call(this);return n.viewprereset=this._onViewPreReset,n},_onViewPreReset:function(){this._postponeUpdatePaths=!0},onAdd:function(){Bi.prototype.onAdd.call(this),this._draw()},_initContainer:function(){var n=this._container=document.createElement("canvas");ae(n,"mousemove",this._onMouseMove,this),ae(n,"click dblclick mousedown mouseup contextmenu",this._onClick,this),ae(n,"mouseout",this._handleMouseOut,this),n._leaflet_disable_events=!0,this._ctx=n.getContext("2d")},_destroyContainer:function(){G(this._redrawRequest),delete this._ctx,wt(this._container),Be(this._container),delete this._container},_updatePaths:function(){if(!this._postponeUpdatePaths){var n;this._redrawBounds=null;for(var o in this._layers)n=this._layers[o],n._update();this._redraw()}},_update:function(){if(!(this._map._animatingZoom&&this._bounds)){Bi.prototype._update.call(this);var n=this._bounds,o=this._container,c=n.getSize(),f=Lt.retina?2:1;Nt(o,n.min),o.width=f*c.x,o.height=f*c.y,o.style.width=c.x+"px",o.style.height=c.y+"px",Lt.retina&&this._ctx.scale(2,2),this._ctx.translate(-n.min.x,-n.min.y),this.fire("update")}},_reset:function(){Bi.prototype._reset.call(this),this._postponeUpdatePaths&&(this._postponeUpdatePaths=!1,this._updatePaths())},_initPath:function(n){this._updateDashArray(n),this._layers[u(n)]=n;var o=n._order={layer:n,prev:this._drawLast,next:null};this._drawLast&&(this._drawLast.next=o),this._drawLast=o,this._drawFirst=this._drawFirst||this._drawLast},_addPath:function(n){this._requestRedraw(n)},_removePath:function(n){var o=n._order,c=o.next,f=o.prev;c?c.prev=f:this._drawLast=f,f?f.next=c:this._drawFirst=c,delete n._order,delete this._layers[u(n)],this._requestRedraw(n)},_updatePath:function(n){this._extendRedrawBounds(n),n._project(),n._update(),this._requestRedraw(n)},_updateStyle:function(n){this._updateDashArray(n),this._requestRedraw(n)},_updateDashArray:function(n){if(typeof n.options.dashArray=="string"){var o=n.options.dashArray.split(/[, ]+/),c=[],f,S;for(S=0;S<o.length;S++){if(f=Number(o[S]),isNaN(f))return;c.push(f)}n.options._dashArray=c}else n.options._dashArray=n.options.dashArray},_requestRedraw:function(n){this._map&&(this._extendRedrawBounds(n),this._redrawRequest=this._redrawRequest||k(this._redraw,this))},_extendRedrawBounds:function(n){if(n._pxBounds){var o=(n.options.weight||0)+1;this._redrawBounds=this._redrawBounds||new lt,this._redrawBounds.extend(n._pxBounds.min.subtract([o,o])),this._redrawBounds.extend(n._pxBounds.max.add([o,o]))}},_redraw:function(){this._redrawRequest=null,this._redrawBounds&&(this._redrawBounds.min._floor(),this._redrawBounds.max._ceil()),this._clear(),this._draw(),this._redrawBounds=null},_clear:function(){var n=this._redrawBounds;if(n){var o=n.getSize();this._ctx.clearRect(n.min.x,n.min.y,o.x,o.y)}else this._ctx.save(),this._ctx.setTransform(1,0,0,1,0,0),this._ctx.clearRect(0,0,this._container.width,this._container.height),this._ctx.restore()},_draw:function(){var n,o=this._redrawBounds;if(this._ctx.save(),o){var c=o.getSize();this._ctx.beginPath(),this._ctx.rect(o.min.x,o.min.y,c.x,c.y),this._ctx.clip()}this._drawing=!0;for(var f=this._drawFirst;f;f=f.next)n=f.layer,(!o||n._pxBounds&&n._pxBounds.intersects(o))&&n._updatePath();this._drawing=!1,this._ctx.restore()},_updatePoly:function(n,o){if(this._drawing){var c,f,S,C,V=n._parts,ut=V.length,ft=this._ctx;if(ut){for(ft.beginPath(),c=0;c<ut;c++){for(f=0,S=V[c].length;f<S;f++)C=V[c][f],ft[f?"lineTo":"moveTo"](C.x,C.y);o&&ft.closePath()}this._fillStroke(ft,n)}}},_updateCircle:function(n){if(!(!this._drawing||n._empty())){var o=n._point,c=this._ctx,f=Math.max(Math.round(n._radius),1),S=(Math.max(Math.round(n._radiusY),1)||f)/f;S!==1&&(c.save(),c.scale(1,S)),c.beginPath(),c.arc(o.x,o.y/S,f,0,Math.PI*2,!1),S!==1&&c.restore(),this._fillStroke(c,n)}},_fillStroke:function(n,o){var c=o.options;c.fill&&(n.globalAlpha=c.fillOpacity,n.fillStyle=c.fillColor||c.color,n.fill(c.fillRule||"evenodd")),c.stroke&&c.weight!==0&&(n.setLineDash&&n.setLineDash(o.options&&o.options._dashArray||[]),n.globalAlpha=c.opacity,n.lineWidth=c.weight,n.strokeStyle=c.color,n.lineCap=c.lineCap,n.lineJoin=c.lineJoin,n.stroke())},_onClick:function(n){for(var o=this._map.mouseEventToLayerPoint(n),c,f,S=this._drawFirst;S;S=S.next)c=S.layer,c.options.interactive&&c._containsPoint(o)&&(!(n.type==="click"||n.type==="preclick")||!this._map._draggableMoved(c))&&(f=c);this._fireEvent(f?[f]:!1,n)},_onMouseMove:function(n){if(!(!this._map||this._map.dragging.moving()||this._map._animatingZoom)){var o=this._map.mouseEventToLayerPoint(n);this._handleMouseHover(n,o)}},_handleMouseOut:function(n){var o=this._hoveredLayer;o&&($t(this._container,"leaflet-interactive"),this._fireEvent([o],n,"mouseout"),this._hoveredLayer=null,this._mouseHoverThrottled=!1)},_handleMouseHover:function(n,o){if(!this._mouseHoverThrottled){for(var c,f,S=this._drawFirst;S;S=S.next)c=S.layer,c.options.interactive&&c._containsPoint(o)&&(f=c);f!==this._hoveredLayer&&(this._handleMouseOut(n),f&&(It(this._container,"leaflet-interactive"),this._fireEvent([f],n,"mouseover"),this._hoveredLayer=f)),this._fireEvent(this._hoveredLayer?[this._hoveredLayer]:!1,n),this._mouseHoverThrottled=!0,setTimeout(l(function(){this._mouseHoverThrottled=!1},this),32)}},_fireEvent:function(n,o,c){this._map._fireDOMEvent(o,c||o.type,n)},_bringToFront:function(n){var o=n._order;if(o){var c=o.next,f=o.prev;if(c)c.prev=f;else return;f?f.next=c:c&&(this._drawFirst=c),o.prev=this._drawLast,this._drawLast.next=o,o.next=null,this._drawLast=o,this._requestRedraw(n)}},_bringToBack:function(n){var o=n._order;if(o){var c=o.next,f=o.prev;if(f)f.next=c;else return;c?c.prev=f:f&&(this._drawLast=f),o.prev=null,o.next=this._drawFirst,this._drawFirst.prev=o,this._drawFirst=o,this._requestRedraw(n)}}});function nu(n){return Lt.canvas?new eu(n):null}var zr=(function(){try{return document.namespaces.add("lvml","urn:schemas-microsoft-com:vml"),function(n){return document.createElement("<lvml:"+n+' class="lvml">')}}catch{}return function(n){return document.createElement("<"+n+' xmlns="urn:schemas-microsoft.com:vml" class="lvml">')}})(),Zp={_initContainer:function(){this._container=Q("div","leaflet-vml-container")},_update:function(){this._map._animatingZoom||(Bi.prototype._update.call(this),this.fire("update"))},_initPath:function(n){var o=n._container=zr("shape");It(o,"leaflet-vml-shape "+(this.options.className||"")),o.coordsize="1 1",n._path=zr("path"),o.appendChild(n._path),this._updateStyle(n),this._layers[u(n)]=n},_addPath:function(n){var o=n._container;this._container.appendChild(o),n.options.interactive&&n.addInteractiveTarget(o)},_removePath:function(n){var o=n._container;wt(o),n.removeInteractiveTarget(o),delete this._layers[u(n)]},_updateStyle:function(n){var o=n._stroke,c=n._fill,f=n.options,S=n._container;S.stroked=!!f.stroke,S.filled=!!f.fill,f.stroke?(o||(o=n._stroke=zr("stroke")),S.appendChild(o),o.weight=f.weight+"px",o.color=f.color,o.opacity=f.opacity,f.dashArray?o.dashStyle=I(f.dashArray)?f.dashArray.join(" "):f.dashArray.replace(/( *, *)/g," "):o.dashStyle="",o.endcap=f.lineCap.replace("butt","flat"),o.joinstyle=f.lineJoin):o&&(S.removeChild(o),n._stroke=null),f.fill?(c||(c=n._fill=zr("fill")),S.appendChild(c),c.color=f.fillColor||f.color,c.opacity=f.fillOpacity):c&&(S.removeChild(c),n._fill=null)},_updateCircle:function(n){var o=n._point.round(),c=Math.round(n._radius),f=Math.round(n._radiusY||c);this._setPath(n,n._empty()?"M0 0":"AL "+o.x+","+o.y+" "+c+","+f+" 0,"+65535*360)},_setPath:function(n,o){n._path.v=o},_bringToFront:function(n){At(n._container)},_bringToBack:function(n){Ut(n._container)}},zo=Lt.vml?zr:We,Br=Bi.extend({_initContainer:function(){this._container=zo("svg"),this._container.setAttribute("pointer-events","none"),this._rootGroup=zo("g"),this._container.appendChild(this._rootGroup)},_destroyContainer:function(){wt(this._container),Be(this._container),delete this._container,delete this._rootGroup,delete this._svgSize},_update:function(){if(!(this._map._animatingZoom&&this._bounds)){Bi.prototype._update.call(this);var n=this._bounds,o=n.getSize(),c=this._container;(!this._svgSize||!this._svgSize.equals(o))&&(this._svgSize=o,c.setAttribute("width",o.x),c.setAttribute("height",o.y)),Nt(c,n.min),c.setAttribute("viewBox",[n.min.x,n.min.y,o.x,o.y].join(" ")),this.fire("update")}},_initPath:function(n){var o=n._path=zo("path");n.options.className&&It(o,n.options.className),n.options.interactive&&It(o,"leaflet-interactive"),this._updateStyle(n),this._layers[u(n)]=n},_addPath:function(n){this._rootGroup||this._initContainer(),this._rootGroup.appendChild(n._path),n.addInteractiveTarget(n._path)},_removePath:function(n){wt(n._path),n.removeInteractiveTarget(n._path),delete this._layers[u(n)]},_updatePath:function(n){n._project(),n._update()},_updateStyle:function(n){var o=n._path,c=n.options;o&&(c.stroke?(o.setAttribute("stroke",c.color),o.setAttribute("stroke-opacity",c.opacity),o.setAttribute("stroke-width",c.weight),o.setAttribute("stroke-linecap",c.lineCap),o.setAttribute("stroke-linejoin",c.lineJoin),c.dashArray?o.setAttribute("stroke-dasharray",c.dashArray):o.removeAttribute("stroke-dasharray"),c.dashOffset?o.setAttribute("stroke-dashoffset",c.dashOffset):o.removeAttribute("stroke-dashoffset")):o.setAttribute("stroke","none"),c.fill?(o.setAttribute("fill",c.fillColor||c.color),o.setAttribute("fill-opacity",c.fillOpacity),o.setAttribute("fill-rule",c.fillRule||"evenodd")):o.setAttribute("fill","none"))},_updatePoly:function(n,o){this._setPath(n,He(n._parts,o))},_updateCircle:function(n){var o=n._point,c=Math.max(Math.round(n._radius),1),f=Math.max(Math.round(n._radiusY),1)||c,S="a"+c+","+f+" 0 1,0 ",C=n._empty()?"M0 0":"M"+(o.x-c)+","+o.y+S+c*2+",0 "+S+-c*2+",0 ";this._setPath(n,C)},_setPath:function(n,o){n._path.setAttribute("d",o)},_bringToFront:function(n){At(n._path)},_bringToBack:function(n){Ut(n._path)}});Lt.vml&&Br.include(Zp);function iu(n){return Lt.svg||Lt.vml?new Br(n):null}Se.include({getRenderer:function(n){var o=n.options.renderer||this._getPaneRenderer(n.options.pane)||this.options.renderer||this._renderer;return o||(o=this._renderer=this._createRenderer()),this.hasLayer(o)||this.addLayer(o),o},_getPaneRenderer:function(n){if(n==="overlayPane"||n===void 0)return!1;var o=this._paneRenderers[n];return o===void 0&&(o=this._createRenderer({pane:n}),this._paneRenderers[n]=o),o},_createRenderer:function(n){return this.options.preferCanvas&&nu(n)||iu(n)}});var su=Js.extend({initialize:function(n,o){Js.prototype.initialize.call(this,this._boundsToLatLngs(n),o)},setBounds:function(n){return this.setLatLngs(this._boundsToLatLngs(n))},_boundsToLatLngs:function(n){return n=J(n),[n.getSouthWest(),n.getNorthWest(),n.getNorthEast(),n.getSouthEast()]}});function qp(n,o){return new su(n,o)}Br.create=zo,Br.pointsToPath=He,zi.geometryToLayer=Lo,zi.coordsToLatLng=cl,zi.coordsToLatLngs=Io,zi.latLngToCoords=hl,zi.latLngsToCoords=Do,zi.getFeature=Qs,zi.asFeature=No,Se.mergeOptions({boxZoom:!0});var ru=yi.extend({initialize:function(n){this._map=n,this._container=n._container,this._pane=n._panes.overlayPane,this._resetStateTimeout=0,n.on("unload",this._destroy,this)},addHooks:function(){ae(this._container,"mousedown",this._onMouseDown,this)},removeHooks:function(){Be(this._container,"mousedown",this._onMouseDown,this)},moved:function(){return this._moved},_destroy:function(){wt(this._pane),delete this._pane},_resetState:function(){this._resetStateTimeout=0,this._moved=!1},_clearDeferredResetState:function(){this._resetStateTimeout!==0&&(clearTimeout(this._resetStateTimeout),this._resetStateTimeout=0)},_onMouseDown:function(n){if(!n.shiftKey||n.which!==1&&n.button!==1)return!1;this._clearDeferredResetState(),this._resetState(),ge(),Qn(),this._startPoint=this._map.mouseEventToContainerPoint(n),ae(document,{contextmenu:Es,mousemove:this._onMouseMove,mouseup:this._onMouseUp,keydown:this._onKeyDown},this)},_onMouseMove:function(n){this._moved||(this._moved=!0,this._box=Q("div","leaflet-zoom-box",this._container),It(this._container,"leaflet-crosshair"),this._map.fire("boxzoomstart")),this._point=this._map.mouseEventToContainerPoint(n);var o=new lt(this._point,this._startPoint),c=o.getSize();Nt(this._box,o.min),this._box.style.width=c.x+"px",this._box.style.height=c.y+"px"},_finish:function(){this._moved&&(wt(this._box),$t(this._container,"leaflet-crosshair")),Gn(),ri(),Be(document,{contextmenu:Es,mousemove:this._onMouseMove,mouseup:this._onMouseUp,keydown:this._onKeyDown},this)},_onMouseUp:function(n){if(!(n.which!==1&&n.button!==1)&&(this._finish(),!!this._moved)){this._clearDeferredResetState(),this._resetStateTimeout=setTimeout(l(this._resetState,this),0);var o=new Dt(this._map.containerPointToLatLng(this._startPoint),this._map.containerPointToLatLng(this._point));this._map.fitBounds(o).fire("boxzoomend",{boxZoomBounds:o})}},_onKeyDown:function(n){n.keyCode===27&&(this._finish(),this._clearDeferredResetState(),this._resetState())}});Se.addInitHook("addHandler","boxZoom",ru),Se.mergeOptions({doubleClickZoom:!0});var ou=yi.extend({addHooks:function(){this._map.on("dblclick",this._onDoubleClick,this)},removeHooks:function(){this._map.off("dblclick",this._onDoubleClick,this)},_onDoubleClick:function(n){var o=this._map,c=o.getZoom(),f=o.options.zoomDelta,S=n.originalEvent.shiftKey?c-f:c+f;o.options.doubleClickZoom==="center"?o.setZoom(S):o.setZoomAround(n.containerPoint,S)}});Se.addInitHook("addHandler","doubleClickZoom",ou),Se.mergeOptions({dragging:!0,inertia:!0,inertiaDeceleration:3400,inertiaMaxSpeed:1/0,easeLinearity:.2,worldCopyJump:!1,maxBoundsViscosity:0});var au=yi.extend({addHooks:function(){if(!this._draggable){var n=this._map;this._draggable=new is(n._mapPane,n._container),this._draggable.on({dragstart:this._onDragStart,drag:this._onDrag,dragend:this._onDragEnd},this),this._draggable.on("predrag",this._onPreDragLimit,this),n.options.worldCopyJump&&(this._draggable.on("predrag",this._onPreDragWrap,this),n.on("zoomend",this._onZoomEnd,this),n.whenReady(this._onZoomEnd,this))}It(this._map._container,"leaflet-grab leaflet-touch-drag"),this._draggable.enable(),this._positions=[],this._times=[]},removeHooks:function(){$t(this._map._container,"leaflet-grab"),$t(this._map._container,"leaflet-touch-drag"),this._draggable.disable()},moved:function(){return this._draggable&&this._draggable._moved},moving:function(){return this._draggable&&this._draggable._moving},_onDragStart:function(){var n=this._map;if(n._stop(),this._map.options.maxBounds&&this._map.options.maxBoundsViscosity){var o=J(this._map.options.maxBounds);this._offsetLimit=St(this._map.latLngToContainerPoint(o.getNorthWest()).multiplyBy(-1),this._map.latLngToContainerPoint(o.getSouthEast()).multiplyBy(-1).add(this._map.getSize())),this._viscosity=Math.min(1,Math.max(0,this._map.options.maxBoundsViscosity))}else this._offsetLimit=null;n.fire("movestart").fire("dragstart"),n.options.inertia&&(this._positions=[],this._times=[])},_onDrag:function(n){if(this._map.options.inertia){var o=this._lastTime=+new Date,c=this._lastPos=this._draggable._absPos||this._draggable._newPos;this._positions.push(c),this._times.push(o),this._prunePositions(o)}this._map.fire("move",n).fire("drag",n)},_prunePositions:function(n){for(;this._positions.length>1&&n-this._times[0]>50;)this._positions.shift(),this._times.shift()},_onZoomEnd:function(){var n=this._map.getSize().divideBy(2),o=this._map.latLngToLayerPoint([0,0]);this._initialWorldOffset=o.subtract(n).x,this._worldWidth=this._map.getPixelWorldBounds().getSize().x},_viscousLimit:function(n,o){return n-(n-o)*this._viscosity},_onPreDragLimit:function(){if(!(!this._viscosity||!this._offsetLimit)){var n=this._draggable._newPos.subtract(this._draggable._startPos),o=this._offsetLimit;n.x<o.min.x&&(n.x=this._viscousLimit(n.x,o.min.x)),n.y<o.min.y&&(n.y=this._viscousLimit(n.y,o.min.y)),n.x>o.max.x&&(n.x=this._viscousLimit(n.x,o.max.x)),n.y>o.max.y&&(n.y=this._viscousLimit(n.y,o.max.y)),this._draggable._newPos=this._draggable._startPos.add(n)}},_onPreDragWrap:function(){var n=this._worldWidth,o=Math.round(n/2),c=this._initialWorldOffset,f=this._draggable._newPos.x,S=(f-o+c)%n+o-c,C=(f+o+c)%n-o-c,V=Math.abs(S+c)<Math.abs(C+c)?S:C;this._draggable._absPos=this._draggable._newPos.clone(),this._draggable._newPos.x=V},_onDragEnd:function(n){var o=this._map,c=o.options,f=!c.inertia||n.noInertia||this._times.length<2;if(o.fire("dragend",n),f)o.fire("moveend");else{this._prunePositions(+new Date);var S=this._lastPos.subtract(this._positions[0]),C=(this._lastTime-this._times[0])/1e3,V=c.easeLinearity,ut=S.multiplyBy(V/C),ft=ut.distanceTo([0,0]),Et=Math.min(c.inertiaMaxSpeed,ft),Gt=ut.multiplyBy(Et/ft),ee=Et/(c.inertiaDeceleration*V),_e=Gt.multiplyBy(-ee/2).round();!_e.x&&!_e.y?o.fire("moveend"):(_e=o._limitOffset(_e,o.options.maxBounds),k(function(){o.panBy(_e,{duration:ee,easeLinearity:V,noMoveStart:!0,animate:!0})}))}}});Se.addInitHook("addHandler","dragging",au),Se.mergeOptions({keyboard:!0,keyboardPanDelta:80});var lu=yi.extend({keyCodes:{left:[37],right:[39],down:[40],up:[38],zoomIn:[187,107,61,171],zoomOut:[189,109,54,173]},initialize:function(n){this._map=n,this._setPanDelta(n.options.keyboardPanDelta),this._setZoomDelta(n.options.zoomDelta)},addHooks:function(){var n=this._map._container;n.tabIndex<=0&&(n.tabIndex="0"),ae(n,{focus:this._onFocus,blur:this._onBlur,mousedown:this._onMouseDown},this),this._map.on({focus:this._addHooks,blur:this._removeHooks},this)},removeHooks:function(){this._removeHooks(),Be(this._map._container,{focus:this._onFocus,blur:this._onBlur,mousedown:this._onMouseDown},this),this._map.off({focus:this._addHooks,blur:this._removeHooks},this)},_onMouseDown:function(){if(!this._focused){var n=document.body,o=document.documentElement,c=n.scrollTop||o.scrollTop,f=n.scrollLeft||o.scrollLeft;this._map._container.focus(),window.scrollTo(f,c)}},_onFocus:function(){this._focused=!0,this._map.fire("focus")},_onBlur:function(){this._focused=!1,this._map.fire("blur")},_setPanDelta:function(n){var o=this._panKeys={},c=this.keyCodes,f,S;for(f=0,S=c.left.length;f<S;f++)o[c.left[f]]=[-1*n,0];for(f=0,S=c.right.length;f<S;f++)o[c.right[f]]=[n,0];for(f=0,S=c.down.length;f<S;f++)o[c.down[f]]=[0,n];for(f=0,S=c.up.length;f<S;f++)o[c.up[f]]=[0,-1*n]},_setZoomDelta:function(n){var o=this._zoomKeys={},c=this.keyCodes,f,S;for(f=0,S=c.zoomIn.length;f<S;f++)o[c.zoomIn[f]]=n;for(f=0,S=c.zoomOut.length;f<S;f++)o[c.zoomOut[f]]=-n},_addHooks:function(){ae(document,"keydown",this._onKeyDown,this)},_removeHooks:function(){Be(document,"keydown",this._onKeyDown,this)},_onKeyDown:function(n){if(!(n.altKey||n.ctrlKey||n.metaKey)){var o=n.keyCode,c=this._map,f;if(o in this._panKeys){if(!c._panAnim||!c._panAnim._inProgress)if(f=this._panKeys[o],n.shiftKey&&(f=Y(f).multiplyBy(3)),c.options.maxBounds&&(f=c._limitOffset(Y(f),c.options.maxBounds)),c.options.worldCopyJump){var S=c.wrapLatLng(c.unproject(c.project(c.getCenter()).add(f)));c.panTo(S)}else c.panBy(f)}else if(o in this._zoomKeys)c.setZoom(c.getZoom()+(n.shiftKey?3:1)*this._zoomKeys[o]);else if(o===27&&c._popup&&c._popup.options.closeOnEscapeKey)c.closePopup();else return;Es(n)}}});Se.addInitHook("addHandler","keyboard",lu),Se.mergeOptions({scrollWheelZoom:!0,wheelDebounceTime:40,wheelPxPerZoomLevel:60});var cu=yi.extend({addHooks:function(){ae(this._map._container,"wheel",this._onWheelScroll,this),this._delta=0},removeHooks:function(){Be(this._map._container,"wheel",this._onWheelScroll,this)},_onWheelScroll:function(n){var o=Dh(n),c=this._map.options.wheelDebounceTime;this._delta+=o,this._lastMousePos=this._map.mouseEventToContainerPoint(n),this._startTime||(this._startTime=+new Date);var f=Math.max(c-(+new Date-this._startTime),0);clearTimeout(this._timer),this._timer=setTimeout(l(this._performZoom,this),f),Es(n)},_performZoom:function(){var n=this._map,o=n.getZoom(),c=this._map.options.zoomSnap||0;n._stop();var f=this._delta/(this._map.options.wheelPxPerZoomLevel*4),S=4*Math.log(2/(1+Math.exp(-Math.abs(f))))/Math.LN2,C=c?Math.ceil(S/c)*c:S,V=n._limitZoom(o+(this._delta>0?C:-C))-o;this._delta=0,this._startTime=null,V&&(n.options.scrollWheelZoom==="center"?n.setZoom(o+V):n.setZoomAround(this._lastMousePos,o+V))}});Se.addInitHook("addHandler","scrollWheelZoom",cu);var $p=600;Se.mergeOptions({tapHold:Lt.touchNative&&Lt.safari&&Lt.mobile,tapTolerance:15});var hu=yi.extend({addHooks:function(){ae(this._map._container,"touchstart",this._onDown,this)},removeHooks:function(){Be(this._map._container,"touchstart",this._onDown,this)},_onDown:function(n){if(clearTimeout(this._holdTimeout),n.touches.length===1){var o=n.touches[0];this._startPos=this._newPos=new st(o.clientX,o.clientY),this._holdTimeout=setTimeout(l(function(){this._cancel(),this._isTapValid()&&(ae(document,"touchend",wn),ae(document,"touchend touchcancel",this._cancelClickPrevent),this._simulateEvent("contextmenu",o))},this),$p),ae(document,"touchend touchcancel contextmenu",this._cancel,this),ae(document,"touchmove",this._onMove,this)}},_cancelClickPrevent:function n(){Be(document,"touchend",wn),Be(document,"touchend touchcancel",n)},_cancel:function(){clearTimeout(this._holdTimeout),Be(document,"touchend touchcancel contextmenu",this._cancel,this),Be(document,"touchmove",this._onMove,this)},_onMove:function(n){var o=n.touches[0];this._newPos=new st(o.clientX,o.clientY)},_isTapValid:function(){return this._newPos.distanceTo(this._startPos)<=this._map.options.tapTolerance},_simulateEvent:function(n,o){var c=new MouseEvent(n,{bubbles:!0,cancelable:!0,view:window,screenX:o.screenX,screenY:o.screenY,clientX:o.clientX,clientY:o.clientY});c._simulated=!0,o.target.dispatchEvent(c)}});Se.addInitHook("addHandler","tapHold",hu),Se.mergeOptions({touchZoom:Lt.touch,bounceAtZoomLimits:!0});var uu=yi.extend({addHooks:function(){It(this._map._container,"leaflet-touch-zoom"),ae(this._map._container,"touchstart",this._onTouchStart,this)},removeHooks:function(){$t(this._map._container,"leaflet-touch-zoom"),Be(this._map._container,"touchstart",this._onTouchStart,this)},_onTouchStart:function(n){var o=this._map;if(!(!n.touches||n.touches.length!==2||o._animatingZoom||this._zooming)){var c=o.mouseEventToContainerPoint(n.touches[0]),f=o.mouseEventToContainerPoint(n.touches[1]);this._centerPoint=o.getSize()._divideBy(2),this._startLatLng=o.containerPointToLatLng(this._centerPoint),o.options.touchZoom!=="center"&&(this._pinchStartLatLng=o.containerPointToLatLng(c.add(f)._divideBy(2))),this._startDist=c.distanceTo(f),this._startZoom=o.getZoom(),this._moved=!1,this._zooming=!0,o._stop(),ae(document,"touchmove",this._onTouchMove,this),ae(document,"touchend touchcancel",this._onTouchEnd,this),wn(n)}},_onTouchMove:function(n){if(!(!n.touches||n.touches.length!==2||!this._zooming)){var o=this._map,c=o.mouseEventToContainerPoint(n.touches[0]),f=o.mouseEventToContainerPoint(n.touches[1]),S=c.distanceTo(f)/this._startDist;if(this._zoom=o.getScaleZoom(S,this._startZoom),!o.options.bounceAtZoomLimits&&(this._zoom<o.getMinZoom()&&S<1||this._zoom>o.getMaxZoom()&&S>1)&&(this._zoom=o._limitZoom(this._zoom)),o.options.touchZoom==="center"){if(this._center=this._startLatLng,S===1)return}else{var C=c._add(f)._divideBy(2)._subtract(this._centerPoint);if(S===1&&C.x===0&&C.y===0)return;this._center=o.unproject(o.project(this._pinchStartLatLng,this._zoom).subtract(C),this._zoom)}this._moved||(o._moveStart(!0,!1),this._moved=!0),G(this._animRequest);var V=l(o._move,o,this._center,this._zoom,{pinch:!0,round:!1},void 0);this._animRequest=k(V,this,!0),wn(n)}},_onTouchEnd:function(){if(!this._moved||!this._zooming){this._zooming=!1;return}this._zooming=!1,G(this._animRequest),Be(document,"touchmove",this._onTouchMove,this),Be(document,"touchend touchcancel",this._onTouchEnd,this),this._map.options.zoomAnimation?this._map._animateZoom(this._center,this._map._limitZoom(this._zoom),!0,this._map.options.zoomSnap):this._map._resetView(this._center,this._map._limitZoom(this._zoom))}});Se.addInitHook("addHandler","touchZoom",uu),Se.BoxZoom=ru,Se.DoubleClickZoom=ou,Se.Drag=au,Se.Keyboard=lu,Se.ScrollWheelZoom=cu,Se.TapHold=hu,Se.TouchZoom=uu,e.Bounds=lt,e.Browser=Lt,e.CRS=Wt,e.Canvas=eu,e.Circle=ll,e.CircleMarker=Co,e.Class=z,e.Control=oi,e.DivIcon=Qh,e.DivOverlay=Si,e.DomEvent=dp,e.DomUtil=Ao,e.Draggable=is,e.Evented=$,e.FeatureGroup=Ui,e.GeoJSON=zi,e.GridLayer=Or,e.Handler=yi,e.Icon=Ks,e.ImageOverlay=Fo,e.LatLng=Mt,e.LatLngBounds=Dt,e.Layer=ai,e.LayerGroup=Ys,e.LineUtil=Ep,e.Map=Se,e.Marker=Po,e.Mixin=xp,e.Path=ss,e.Point=st,e.PolyUtil=Mp,e.Polygon=Js,e.Polyline=Oi,e.Popup=Uo,e.PosAnimation=Nh,e.Projection=Tp,e.Rectangle=su,e.Renderer=Bi,e.SVG=Br,e.SVGOverlay=Jh,e.TileLayer=js,e.Tooltip=Oo,e.Transformation=Jt,e.Util=W,e.VideoOverlay=Kh,e.bind=l,e.bounds=St,e.canvas=nu,e.circle=Np,e.circleMarker=Dp,e.control=Nr,e.divIcon=Vp,e.extend=r,e.featureGroup=Cp,e.geoJSON=Yh,e.geoJson=Op,e.gridLayer=Wp,e.icon=Lp,e.imageOverlay=zp,e.latLng=yt,e.latLngBounds=J,e.layerGroup=Pp,e.map=fp,e.marker=Ip,e.point=Y,e.polygon=Up,e.polyline=Fp,e.popup=Hp,e.rectangle=qp,e.setOptions=w,e.stamp=u,e.svg=iu,e.svgOverlay=kp,e.tileLayer=jh,e.tooltip=Gp,e.transformation=fe,e.version=i,e.videoOverlay=Bp;var Yp=window.L;e.noConflict=function(){return window.L=Yp,this},window.L=e}))})(Qr,Qr.exports)),Qr.exports}var Uy=Fy();const Is=Dy(Uy),Kf=Gs("worldgen"),ps={minLat:57.5,maxLat:71.4,minLon:3.5,maxLon:31.5},Oy="https://wcs.geonorge.no/skwms1/wcs.hoyde-dtm-nhm-25833",zy="nhm_dtm_topo_25833",Wl=6e3,By=1400,ky=480,Hy=6,Gy=384,Vy=900;function kc(s,t){return s>=ps.minLat&&s<=ps.maxLat&&t>=ps.minLon&&t<=ps.maxLon}function Wy(s){const t=Math.round(s/Hy);return zt(2*Math.round(t/2),Gy,Vy)}function Xy(s,{margin:t=ky}={}){if(!s||s.length<2)throw new Error("The route has no coordinates.");let e=1/0,i=-1/0,r=1/0,a=-1/0;for(const v of s)v.lat<e&&(e=v.lat),v.lat>i&&(i=v.lat),v.lon<r&&(r=v.lon),v.lon>a&&(a=v.lon);const l=(e+i)/2,h=(r+a)/2,u=Gf(l,h);let d=0;for(const v of s){const b=u.worldFromLatLon(v.lat,v.lon);d=Math.max(d,Math.abs(b.x),Math.abs(b.z))}const m=d+t;if(m*2>Wl){const v=(m*2/1e3).toFixed(1);throw new Error(`That route needs a ${v} km world. Pick two points closer together — a generated stage can be up to ${(Wl/1e3).toFixed(1)} km across.`)}const _=zt(m*2,By,Wl),p=_/2,g=Wy(_),y=u.latLonFromWorld(-p,-p),w=u.latLonFromWorld(p,p),M={minLat:Math.min(y.lat,w.lat),maxLat:Math.max(y.lat,w.lat),minLon:Math.min(y.lon,w.lon),maxLon:Math.max(y.lon,w.lon)};return{projection:u,lat0:l,lon0:h,worldSize:_,halfSize:p,grid:g,bbox:M,requiredSize:m*2}}function Zy(s,t){const e=`${s.minLon.toFixed(7)},${s.minLat.toFixed(7)},${s.maxLon.toFixed(7)},${s.maxLat.toFixed(7)}`,i=new URLSearchParams({service:"WCS",version:"1.0.0",request:"GetCoverage",Coverage:zy,CRS:"EPSG:4326",BBOX:e,WIDTH:String(t),HEIGHT:String(t),FORMAT:"GeoTIFF"});return`${Oy}?${i.toString()}`}async function qy(s,t){const e=await fetch(s);if(!e.ok)throw new Error(`Kartverket elevation service answered HTTP ${e.status}.`);const i=Number(e.headers.get("content-length"))||0;if(!e.body)return e.arrayBuffer();const r=e.body.getReader(),a=[];let l=0;for(;;){const{done:d,value:m}=await r.read();if(d)break;a.push(m),l+=m.byteLength,i&&t?.(Math.min(.92,l/i))}t?.(1);const h=new Uint8Array(l);let u=0;for(const d of a)h.set(d,u),u+=d.byteLength;return h.buffer}async function Hc({bbox:s,grid:t,onProgress:e}){if(!window.GeoTIFF)throw new Error("geotiff.js did not load.");const i=Zy(s,t);Kf.debug(`DEM request ${t}×${t}: ${i}`);const r=await qy(i,p=>e?.(p));e?.(.55,"Unpacking the 1 m elevation model…");const u=(await(await(await window.GeoTIFF.fromArrayBuffer(r)).getImage()).readRasters({width:t,height:t,resampleMethod:"bilinear"}))[0];if(!u||u.length<t*t)throw new Error("Kartverket returned an elevation tile the game could not read.");const d=new Float32Array(t*t);let m=1/0,_=-1/0;for(let p=0;p<d.length;p++){const g=u[p],y=!Number.isFinite(g)||g<-1e3?0:Math.max(0,g);d[p]=y,y<m&&(m=y),y>_&&(_=y)}return{heights:d,minH:m,maxH:_,grid:t}}function $y(s,t,{title:e="Norway"}={}){const i=Vf({heights:t.heights,grid:s.grid,sizeX:s.worldSize,sizeZ:s.worldSize,projection:s.projection,scene:{name:"generated",title:e,lat:s.lat0,lon:s.lon0},basemapUrl:null,meta:{originX:0,originY:0,lat0:s.lat0,lon0:s.lon0,generated:!0,bbox:s.bbox}});return i.chunks=Math.max(4,Math.round((s.grid-1)/73)),i.generated=!0,i.title=e,i.bbox=s.bbox,i}async function Yy(s,{title:t="Norway",onProgress:e}={}){const i=Xy(s);e?.(.08,`Generating a ${(i.worldSize/1e3).toFixed(1)} km world…`);const r=await Hc({bbox:i.bbox,grid:i.grid,onProgress:(l,h)=>e?.(.08+l*.72,h||"Downloading elevation…")});e?.(.85,"Building the height field…");const a=$y(i,r,{title:t});return Kf.info(`generated terrain ${a.title}: ${(i.worldSize/1e3).toFixed(1)} km, ${i.grid}² samples, ${a.minH.toFixed(0)}–${a.maxH.toFixed(0)} m`),{terrain:a,plan:i}}const $r=Gs("map"),Ky="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",Jy='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';function Qy(s,t){return Is.divIcon({className:"route-pin",html:`<span style="--pin:${t}">${s}</span>`,iconSize:[30,38],iconAnchor:[15,34],popupAnchor:[0,-30]})}function jy({getTerrain:s,onRoute:t}){const e=document.getElementById("mapPicker"),i=document.getElementById("mapCanvas"),r=document.getElementById("mapStatus"),a=document.getElementById("mapGenerate"),l=document.getElementById("mapClear"),h=document.getElementById("mapClose"),u=document.getElementById("mapUseStage"),d=document.getElementById("mapProfile");(!e||!i)&&$r.error("map picker DOM is missing");let m=null,_=null,p=[],g={a:null,b:null},y=!1,w=!1,M=null;function v(W,z=""){r&&(r.textContent=W,r.className=`map-status ${z}`.trim())}function b(){a&&(a.disabled=y||!g.a||!g.b),a&&(a.textContent=y?"ROUTING…":"GENERATE ROUTE"),l&&(l.disabled=y)}function I(){for(const W of p)W.remove();p=[],g={a:null,b:null},b()}function A(W,z){g[z]=W;const j=Is.marker([W.lat,W.lon],{icon:Qy(z.toUpperCase(),z==="a"?"#8fe6a3":"#f0ce58"),draggable:!0}).addTo(m);j.on("dragend",()=>{const rt=j.getLatLng();g[z]={lat:rt.lat,lon:rt.lng},v(`${z.toUpperCase()} moved.`)}),p.push(j),b()}function D(){return m||($r.info("creating Leaflet map"),m=Is.map(i,{zoomControl:!0,attributionControl:!0,minZoom:3,maxZoom:18,worldCopyJump:!0}).setView([64.5,12],4),Is.tileLayer(Ky,{attribution:Jy,maxZoom:19}).addTo(m),_=Is.rectangle([[-1,-1],[1,1]],{color:"#f0ce58",weight:2,dashArray:"6 6",fill:!1,interactive:!1}).addTo(m),m.on("click",W=>{const z=W.latlng.lat,j=W.latlng.lng;if(!kc(z,j)){v("That spot is outside Norway. Pick a start and finish inside the country.","err");return}!g.a||g.a&&g.b?(I(),A({lat:z,lon:j},"a"),v("Start set. Click the finish point — anywhere in Norway.")):(A({lat:z,lon:j},"b"),v("Both points set. Press GENERATE ROUTE to build that world.")),b()}),m)}const E=()=>Is.latLngBounds([ps.minLat,ps.minLon],[ps.maxLat,ps.maxLon]);function x(){if(!m)return;const W=E();_&&_.setBounds(W),m.fitBounds(W,{padding:[12,12]})}function T(W){const z=W.streaming?W.bounds:{minX:-W.sizeX/2,maxX:W.sizeX/2,minZ:-W.sizeZ/2,maxZ:W.sizeZ/2};return[W.latLonFromWorld(z.minX,z.minZ),W.latLonFromWorld(z.maxX,z.minZ),W.latLonFromWorld(z.maxX,z.maxZ),W.latLonFromWorld(z.minX,z.maxZ)].map(j=>[j.lat,j.lon])}function H(W){if(!m)return;if(!W){x();return}const z=T(W);if(_&&_.setBounds(z),W.generated){m.fitBounds(Is.latLngBounds(z),{padding:[24,24]});return}x()}function F(W,z){if(!e||!i)return;D(),M=z,I(),v("Click anywhere in Norway to set the START point, then the FINISH."),e.classList.remove("hidden"),w=!0;let j=!1;const rt=()=>{j||(j=!0,m?.invalidateSize(),H(W))};requestAnimationFrame(rt),window.setTimeout(rt,150),$r.info("opened route map")}function k(){e?.classList.add("hidden"),w=!1,y=!1,b()}function G(){const W=s();if(!W||!M)return;I();const z=W.latLonFromWorld(M.start.x,M.start.z),j=W.latLonFromWorld(M.finish.x,M.finish.z);A({lat:z.lat,lon:z.lon},"a"),A({lat:j.lat,lon:j.lon},"b"),v("Loaded the current stage. Press GENERATE ROUTE to re-route it.")}return a&&a.addEventListener("click",async()=>{if(!g.a||!g.b||y)return;y=!0,b(),v("Asking OSRM for a road…");const W=performance.now();try{const z=await t({a:g.a,b:g.b,profile:d?.value||"driving"});if($r.info(`OSRM map route finished in ${(performance.now()-W).toFixed(0)} ms`),v(z.message,z.ok?"ok":"err"),z.ok){y=!1,k();return}}catch(z){$r.error("map route failed",z),v(z.message||"Routing failed.","err")}finally{y=!1,b()}}),l?.addEventListener("click",()=>{I(),v("Cleared. Click the map to set a new START point.")}),h?.addEventListener("click",k),u?.addEventListener("click",G),window.addEventListener("keydown",W=>{W.code==="Escape"&&w&&k()}),{open:F,close:k,isOpen:()=>w,invalidate:()=>m?.invalidateSize(),getMap:()=>m}}const Id=Gs("buildings"),tS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"],Jf=120,eS=25e3;let fa=null;function nS(){if(fa)return fa;const s=new Un(1,1,1);s.translate(0,.5,0);const t=new Pr(Math.SQRT1_2,.62,4,1);return t.rotateY(Math.PI/4),t.translate(0,1+.31,0),fa={body:s,roof:t},fa}const Dd=[14207664,12737089,12026975,9083515,14669509,11056312],Nd=[4864564,3817542,5850428,3356990];function iS(s){let t=s>>>0;return function(){t|=0,t=t+1831565813|0;let i=Math.imul(t^t>>>15,1|t);return i=Math.imul(i^i>>>7,61|i)^i,((i^i>>>14)>>>0)/4294967296}}async function sS({minLat:s,minLon:t,maxLat:e,maxLon:i}){const r=`${s.toFixed(6)},${t.toFixed(6)},${e.toFixed(6)},${i.toFixed(6)}`,a=`[out:json][timeout:20];(way["building"](${r});relation["building"](${r});node["building"](${r}););out center;`;let l=null;for(const h of tS){const u=new AbortController,d=setTimeout(()=>u.abort(),eS);try{const m=await fetch(h,{method:"POST",body:"data="+encodeURIComponent(a),headers:{"Content-Type":"application/x-www-form-urlencoded"},signal:u.signal});if(!m.ok)throw new Error(`HTTP ${m.status}`);const _=await m.json();return rS(_.elements||[])}catch(m){l=m,Id.debug(`overpass attempt failed (${h}): ${m.message}`)}finally{clearTimeout(d)}}return Id.warn(`buildings unavailable: ${l?.message||"no endpoint answered"}`),[]}function rS(s){const t=[];for(const e of s){if(!e||e.type==="note")continue;const i=e.type==="node"?{lat:e.lat,lon:e.lon}:e.center;if(!i||!Number.isFinite(i.lat)||!Number.isFinite(i.lon))continue;let r=9,a=8;if(e.bounds){const l=e.bounds;r=Math.max(2.5,(l.maxLon-l.minLon)*111320*Math.cos(i.lat*Math.PI/180)),a=Math.max(2.5,(l.maxLat-l.minLat)*110950)}if(t.push({lat:i.lat,lon:i.lon,width:r,depth:a}),t.length>=Jf*3)break}return t}function Qf(s,t,e,i=1){const r=iS(i),a=[],l=[],h=[],u=new Ae,d=new Kn,m=new Kn,_=new nt,p=new nt,g=new Qt;for(const I of s){if(a.length>=Jf)break;const A=t.worldFromLatLon(I.lat,I.lon);if(!Number.isFinite(A.x)||!Number.isFinite(A.z)||e&&e.distanceTo(A.x,A.z,24)<10)continue;const D=t.sample(A.x,A.z);if(D<1.5||t.slope(A.x,A.z)>.35)continue;const E=Math.max(I.width,I.depth),x=Math.min(I.width,I.depth),T=gl.clamp(E*.92,5,34),H=gl.clamp(x*.92,4.5,26),F=gl.clamp(Math.min(E,x)*.42,3.2,9.5),k=I.width>=I.depth?0:Math.PI/2;_.set(A.x,D+.05,A.z),m.setFromAxisAngle(new nt(0,1,0),k),d.copy(m),p.set(T,F,H),u.compose(_,d,p),a.push(u.clone()),g.setHex(Dd[Math.floor(r()*Dd.length)]),l.push(g.clone()),g.setHex(Nd[Math.floor(r()*Nd.length)]),h.push(g.clone())}if(!a.length)return null;const y=new hn;y.name="houses";const{body:w,roof:M}=nS(),v=new ji(w,new qe({flatShading:!0}),a.length),b=new ji(M,new qe({flatShading:!0}),a.length);return v.castShadow=!0,v.receiveShadow=!0,b.castShadow=!0,a.forEach((I,A)=>{v.setMatrixAt(A,I),b.setMatrixAt(A,I),v.setColorAt(A,l[A]),b.setColorAt(A,h[A])}),v.instanceMatrix.needsUpdate=!0,b.instanceMatrix.needsUpdate=!0,v.instanceColor&&(v.instanceColor.needsUpdate=!0),b.instanceColor&&(b.instanceColor.needsUpdate=!0),y.add(v,b),y.userData.count=a.length,y}const Gc=Gs("stream"),ie=2048,bn=192,Ce=ie/bn,_n=bn+1,oS=6,aS=520,lS=1500,cS=4,hS=2,Fd=3900,Ud=4700,uS=2200,dS=3,Od=3,Xl=.12,fS=24,pS={foot:"Footpath",cycling:"Bike trail"};function Ls(s,t){return`${s},${t}`}function mS(s){let t=s>>>0;return function(){t|=0,t=t+1831565813|0;let i=Math.imul(t^t>>>15,1|t);return i=Math.imul(i^i>>>7,61|i)^i,((i^i>>>14)>>>0)/4294967296}}const pa=new Float32Array(_n*_n),Zl=new Float32Array(_n*_n);function _S(s,t){const e=s.heights,i=Math.floor(bn/t)+1,r=i*i,a=new Float32Array(r*3),l=new Float32Array(r*3),h=new Qt,u=Ce*t,d=(b,I)=>e[zt(I,0,bn)*_n+zt(b,0,bn)];for(let b=0;b<i;b++){const I=b*t,A=s.z0+I*Ce;for(let D=0;D<i;D++){const E=D*t,x=s.x0+E*Ce,T=b*i+D,H=d(E,I);a[T*3]=x,a[T*3+1]=H,a[T*3+2]=A;const F=(d(E+t,I)-d(E-t,I))/(2*u),k=(d(E,I+t)-d(E,I-t))/(2*u);Ga(H,Math.hypot(F,k),x,A,h),l[T*3]=h.r,l[T*3+1]=h.g,l[T*3+2]=h.b}}const m=[];for(let b=0;b<i-1;b++)for(let I=0;I<i-1;I++){const A=b*i+I,D=A+1,E=A+i,x=E+1;m.push(A,E,D,D,E,x)}const _=[],p=[],g=[],y=b=>{const I=[];if(b==="north"||b==="south"){const D=b==="north"?0:i-1;for(let E=0;E<i;E++)I.push(D*i+E)}else{const D=b==="west"?0:i-1;for(let E=0;E<i;E++)I.push(E*i+D)}const A=r+_.length/3;for(const D of I)_.push(a[D*3],a[D*3+1]-oS,a[D*3+2]),p.push(l[D*3]*.55,l[D*3+1]*.55,l[D*3+2]*.55);for(let D=0;D<I.length-1;D++)g.push(I[D],A+D,I[D+1],I[D+1],A+D,A+D+1)};y("north"),y("south"),y("west"),y("east");const w=new Float32Array(r*3+_.length);w.set(a,0),w.set(_,r*3);const M=new Float32Array(r*3+p.length);M.set(l,0),M.set(p,r*3);const v=new yn;return v.setAttribute("position",new xn(w,3)),v.setAttribute("color",new xn(M,3)),v.setIndex(m.concat(g)),v.computeVertexNormals(),v.computeBoundingSphere(),v}function zd(s,t){const e=mS(go(t.ci,t.cj,7)*4294967296>>>0),i=new hn;i.name="scatter";const r=s.routeIndex,a=340,l=new ni(.22,.32,2.2,5),h=new Pr(1.7,5.2,5),u=new Ba(1,0),d=new qe({color:4863269,flatShading:!0}),m=new qe({color:16777215,flatShading:!0}),_=new qe({color:7827561,flatShading:!0}),p=new ji(l,d,a),g=new ji(h,m,a);p.castShadow=!0,g.castShadow=!0,g.receiveShadow=!0;const y=new Ae,w=new Kn,M=new nt(0,1,0),v=new nt,b=new nt,I=new Qt;let A=0,D=0;for(;A<a&&D<a*14;){D++;const H=t.x0+e()*ie,F=t.z0+e()*ie,k=s.sample(H,F);if(k<6||k>720||s.slope(H,F)>.62||r&&r.distanceTo(H,F,20)<6)continue;const G=.55+e()*.95;w.setFromAxisAngle(M,e()*Math.PI*2),v.set(H,k+1.1*G,F),b.setScalar(G),y.compose(v,w,b),p.setMatrixAt(A,y),v.set(H,k+4.1*G,F),y.compose(v,w,b),g.setMatrixAt(A,y),I.setHSL(.31+e()*.035,.27+e()*.16,.18+e()*.1),g.setColorAt(A,I),A++}p.count=A,g.count=A,p.instanceMatrix.needsUpdate=!0,g.instanceMatrix.needsUpdate=!0,g.instanceColor&&(g.instanceColor.needsUpdate=!0),A&&i.add(p,g),t.trees=A;const E=60,x=new ji(u,_,E);x.castShadow=!0,x.receiveShadow=!0;let T=0;for(D=0;T<E&&D<E*12;){D++;const H=t.x0+e()*ie,F=t.z0+e()*ie,k=s.sample(H,F);if(k<3||r&&r.distanceTo(H,F,16)<8)continue;const G=.5+e()*2.4;w.setFromAxisAngle(M,e()*Math.PI*2),v.set(H,k+G*.32,F),b.set(G*(.8+e()*.5),G*(.55+e()*.35),G*(.8+e()*.4)),y.compose(v,w,b),x.setMatrixAt(T++,y)}return x.count=T,x.instanceMatrix.needsUpdate=!0,T&&i.add(x),i}async function gS(s,t){if(s.disposed||t.state!=="ready")return;const e=s.projection.latLonFromWorld(t.x0,t.z0),i=s.projection.latLonFromWorld(t.x0+ie,t.z0+ie),r={minLat:Math.min(e.lat,i.lat),maxLat:Math.max(e.lat,i.lat),minLon:Math.min(e.lon,i.lon),maxLon:Math.max(e.lon,i.lon)};try{const a=await sS(r);if(s.disposed||t.state!=="ready")return;t.buildingPlacements=a;const l=Qf(a,s,s.routeIndex,go(t.ci,t.cj,23)*4294967296>>>0);l&&(t.buildingGroup=l,t.group.add(l),houseCount+=l.userData.count||0)}catch(a){Gc.debug(`buildings skipped for ${t.key}: ${a.message}`)}}async function vS({geometry:s,title:t="Streamed stage",onProgress:e=null}={}){const i=s?.coordinates;if(!i||i.length<2)throw new Error("The route has no coordinates.");const r=i[0],a=Gf(r.lat,r.lon),l=i.map(({lat:N,lon:U})=>a.worldFromLatLon(N,U));let h=1/0,u=-1/0,d=1/0,m=-1/0;for(const N of l)N.x<h&&(h=N.x),N.x>u&&(u=N.x),N.z<d&&(d=N.z),N.z>m&&(m=N.z);const _=420,p=h-_,g=u+_,y=d-_,w=m+_,M=g-p,v=w-y,b=zt(Math.round(Math.max(M,v)/26),256,720);e?.(.06,"Fetching the road corridor elevation…");const I=a.latLonFromWorld(p,w),A=a.latLonFromWorld(g,y),D=await Hc({bbox:{minLat:Math.min(I.lat,A.lat),maxLat:Math.max(I.lat,A.lat),minLon:Math.min(I.lon,A.lon),maxLon:Math.max(I.lon,A.lon)},grid:b});if(D.minH===void 0)throw new Error("The corridor elevation came back unreadable.");const E={minX:p,minZ:y,spanX:M,spanZ:v,grid:D.grid,heights:D.heights},x=new Map,T=new Map,H=[],F=[],k=new qe({vertexColors:!0,flatShading:!0}),G=new hn;G.name="streamedWorld";let W=0,z=!1,j={x:l[0].x,z:l[0].z},rt=0,$=0,st=0,tt=D.minH??0,Y=D.maxH??0;const lt=(N,U)=>{const X=(N-E.minX)/E.spanX*(E.grid-1),it=(U-E.minZ)/E.spanZ*(E.grid-1);if(X<0||it<0||X>E.grid-1||it>E.grid-1)return null;const q=zt(Math.floor(X),0,E.grid-2),ot=zt(Math.floor(it),0,E.grid-2),_t=zt(X-q,0,1),B=zt(it-ot,0,1),at=E.heights,et=E.grid,vt=at[ot*et+q],gt=at[ot*et+q+1],mt=at[(ot+1)*et+q],Ot=at[(ot+1)*et+q+1];return ye(ye(vt,gt,_t),ye(mt,Ot,_t),B)},St=(N,U)=>{const X=x.get(Ls(N,U));return X&&X.state==="ready"?X:null},Dt=(N,U)=>{let X=null,it=1/0;for(const qt of x.values()){if(qt.state!=="ready")continue;const Pt=Math.max(qt.x0-N,0,N-(qt.x0+ie)),ne=Math.max(qt.z0-U,0,U-(qt.z0+ie)),Lt=Pt*Pt+ne*ne;Lt<it&&(it=Lt,X=qt)}if(!X)return 0;const q=zt(N,X.x0+Ce/2,X.x0+ie-Ce/2),ot=zt(U,X.z0+Ce/2,X.z0+ie-Ce/2),_t=(q-X.x0)/Ce,B=(ot-X.z0)/Ce,at=zt(Math.floor(_t),0,bn-1),et=zt(Math.floor(B),0,bn-1),vt=zt(_t-at,0,1),gt=zt(B-et,0,1),mt=X.heights,Ot=mt[et*_n+at],Ft=mt[et*_n+at+1],xt=mt[(et+1)*_n+at],kt=mt[(et+1)*_n+at+1];return ye(ye(Ot,Ft,vt),ye(xt,kt,vt),gt)},J={streaming:!0,generated:!0,title:t,scene:{name:"streamed",title:t,lat:r.lat,lon:r.lon},meta:{originX:0,originY:0,generated:!0,anchor:r,streamed:!0},grid:bn,cellX:Ce,cellZ:Ce,heights:null,originX:0,originY:0,sizeX:Math.max(M,v),sizeZ:Math.max(M,v),minH:0,maxH:0,projection:a,group:G,route:null,routeIndex:null,buckets:new Map,worldFromLatLon:(N,U)=>a.worldFromLatLon(N,U),latLonFromWorld:(N,U)=>a.latLonFromWorld(N,U),bounds:{minX:p,maxX:g,minZ:y,maxZ:w},sample(N,U){const X=Math.floor(N/ie),it=Math.floor(U/ie),q=x.get(Ls(X,it));if(q&&q.state==="ready"){const _t=(N-q.x0)/Ce,B=(U-q.z0)/Ce,at=zt(Math.floor(_t),0,bn-1),et=zt(Math.floor(B),0,bn-1),vt=zt(_t-at,0,1),gt=zt(B-et,0,1),mt=q.heights,Ot=mt[et*_n+at],Ft=mt[et*_n+at+1],xt=mt[(et+1)*_n+at],kt=mt[(et+1)*_n+at+1];return ye(ye(Ot,Ft,vt),ye(xt,kt,vt),gt)}const ot=lt(N,U);return ot??Dt(N,U)},gradient(N,U,X=4){const it=(this.sample(N+X,U)-this.sample(N-X,U))/(2*X),q=(this.sample(N,U+X)-this.sample(N,U-X))/(2*X);return{gx:it,gz:q}},slope(N,U){const{gx:X,gz:it}=this.gradient(N,U);return Math.hypot(X,it)},normal(N,U,X=5){const{gx:it,gz:q}=this.gradient(N,U,X);return new nt(-it,1,-q).normalize()},inside(N,U,X=0){const it=Math.floor(N/ie),q=Math.floor(U/ie);if(!St(it,q))return!1;if(X>0){const ot=N-it*ie,_t=U-q*ie,B=ot<X,at=ot>ie-X,et=_t<X,vt=_t>ie-X;if(B&&!St(it-1,q)||at&&!St(it+1,q)||et&&!St(it,q-1)||vt&&!St(it,q+1)||B&&et&&!St(it-1,q-1)||at&&et&&!St(it+1,q-1)||B&&vt&&!St(it-1,q+1)||at&&vt&&!St(it+1,q+1))return!1}return!0},resetHeights(){},flattenPad(N,U,X=18,it=34,q=null){const ot=q??this.sample(N,U),_t=Math.floor((N-X-it)/ie),B=Math.floor((N+X+it)/ie),at=Math.floor((U-X-it)/ie),et=Math.floor((U+X+it)/ie);for(let vt=at;vt<=et;vt++)for(let gt=_t;gt<=B;gt++){const mt=St(gt,vt);mt&&(Rt(mt,N,U,X,it,ot),ce(mt))}return ot},carveRoad(){},pickables(){const N=[];for(const U of x.values())U.state==="ready"&&N.push(U.mesh);return N},stats(){let N=0,U=0,X=0;for(const it of x.values())it.state==="ready"?N++:it.state==="loading"?U++:it.state==="queued"&&X++;return{ready:N,loading:U,queued:X,chunks:N,triangles:Math.round(rt),trees:$,houses:st}},dispose(){z=!0,F.length=0,H.length=0;for(const N of[...x.values()])Ln(N,!1);x.clear(),T.clear(),k.dispose(),G.parent&&G.parent.remove(G)}};J.minH=tt,J.maxH=Y;function Mt(N){const U=N.samples,X=new Float32Array(U.length);for(let q=0;q<U.length;q++){const ot=lt(U[q].x,U[q].z);X[q]=ot??U[q].y??0}const it=9;for(let q=0;q<U.length;q++){let ot=0,_t=0;for(let B=Math.max(0,q-it);B<=Math.min(U.length-1,q+it);B++)ot+=X[B],_t++;U[q].roadY=ot/Math.max(1,_t),U[q].y=U[q].roadY+Xl}N.start=U[0],N.finish=U[U.length-1]}function yt(N){J.buckets.clear(),N.samples.forEach((U,X)=>{const it=Math.floor(U.x/ie),q=Math.floor(U.z/ie),ot=Ls(it,q);let _t=J.buckets.get(ot);_t||J.buckets.set(ot,_t=[]),_t.push(X)})}function Wt(N){const U=J.route;if(!U)return;const X=U.roadWidth+1.2,it=8,q=X+it,ot=ie/2;pa.fill(0),Zl.fill(0);const _t=[];for(let gt=-1;gt<=1;gt++)for(let mt=-1;mt<=1;mt++){const Ot=J.buckets.get(Ls(N.ci+mt,N.cj+gt));Ot&&_t.push(...Ot)}for(const gt of _t){const mt=U.samples[gt],Ot=(mt.roadY??mt.y)+Xl,Ft=Math.max(0,Math.floor((mt.x-q-N.x0)/Ce)-1),xt=Math.min(bn,Math.ceil((mt.x+q-N.x0)/Ce)+1),kt=Math.max(0,Math.floor((mt.z-q-N.z0)/Ce)-1),qt=Math.min(bn,Math.ceil((mt.z+q-N.z0)/Ce)+1);for(let Pt=kt;Pt<=qt;Pt++){const ne=N.z0+Pt*Ce;for(let Lt=Ft;Lt<=xt;Lt++){const Tn=N.x0+Lt*Ce,Ni=Math.hypot(Tn-mt.x,ne-mt.z);if(Ni>q)continue;const Fi=Ni<=X?1:1-La((Ni-X)/it),ns=Pt*_n+Lt;Fi>pa[ns]&&(pa[ns]=Fi,Zl[ns]=Ot)}}}let B=0;for(let gt=0;gt<N.heights.length;gt++){const mt=pa[gt];mt<=.001||(N.heights[gt]=ye(N.heights[gt],Zl[gt],mt),B++)}N.carved=B>0;const at=U.samples[0];Math.abs(at.x-(N.x0+ot))<ie/2+60&&Math.abs(at.z-(N.z0+ot))<ie/2+60&&Rt(N,at.x,at.z,18,34,at.roadY+Xl);let et=1/0,vt=-1/0;for(let gt=0;gt<N.heights.length;gt++){const mt=N.heights[gt];mt<et&&(et=mt),mt>vt&&(vt=mt)}N.minH=et,N.maxH=vt,tt=Math.min(tt,et),Y=Math.max(Y,vt),J.minH=tt,J.maxH=Y}function Rt(N,U,X,it,q,ot){const _t=it+q,B=Math.max(0,Math.floor((U-_t-N.x0)/Ce)),at=Math.min(bn,Math.ceil((U+_t-N.x0)/Ce)),et=Math.max(0,Math.floor((X-_t-N.z0)/Ce)),vt=Math.min(bn,Math.ceil((X+_t-N.z0)/Ce));for(let gt=et;gt<=vt;gt++){const mt=N.z0+gt*Ce;for(let Ot=B;Ot<=at;Ot++){const Ft=N.x0+Ot*Ce,xt=Math.hypot(Ft-U,mt-X);if(xt>_t)continue;const kt=xt<=it?1:1-La((xt-it)/q),qt=gt*_n+Ot;N.heights[qt]=ye(N.heights[qt],ot,kt)}}}function jt(N,U,X){const it=we(N,U,X);return it<aS?0:it<lS?1:2}function we(N,U,X){const it=Math.max(N.x0-U,0,U-(N.x0+ie)),q=Math.max(N.z0-X,0,X-(N.z0+ie));return Math.hypot(it,q)}const Jt=[1,hS,cS];function fe(N,U){return N.geos[U]||(N.geos[U]=_S(N,Jt[U])),N.geos[U]}function ve(N,U){let X=U;N.geos[X]||(X=N.geos[0]?0:N.geos[1]?1:2),!(!N.geos[X]||N.level===X)&&(N.level=X,N.mesh.geometry=N.geos[X],N.mesh.castShadow=X<=1,N.mesh.visible=!0)}function ce(N){const U=N.level>=0?N.level:2;for(let X=0;X<N.geos.length;X++)N.geos[X]?.dispose(),N.geos[X]=null;N.level=-1,fe(N,U),ve(N,U)}function We(N,U,X){const it={ci:N,cj:U,key:Ls(N,U),x0:N*ie,z0:U*ie,state:"queued",priority:X,attempts:0,heights:null,minH:0,maxH:0,geos:[null,null,null],level:-1,mesh:new pe(new yn,k),group:new hn,trees:0,buildingPlacements:null,buildingGroup:null,roadVisuals:null};return it.mesh.name=`streamChunk-${N}-${U}`,it.mesh.receiveShadow=!0,it.mesh.visible=!1,it.group.visible=!1,x.set(it.key,it),F.push(it),it}async function He(N){const U=J.projection.latLonFromWorld(N.x0,N.z0+ie),X=J.projection.latLonFromWorld(N.x0+ie,N.z0),it={minLat:Math.min(U.lat,X.lat),maxLat:Math.max(U.lat,X.lat),minLon:Math.min(U.lon,X.lon),maxLon:Math.max(U.lon,X.lon)},q=T.get(N.key);let ot;q?(T.delete(N.key),ot=q):ot=await Hc({bbox:it,grid:_n}),!(z||N.state==="disposed"||!x.has(N.key))&&(N.heights=ot.heights,N.state="ready",Qe(N))}function Qe(N){Wt(N),fe(N,2),ve(N,jt(N,j.x,j.z)),N.mesh.visible=!0,G.add(N.mesh),N.scatterGroup=zd(J,N),N.group.add(N.scatterGroup),$+=N.trees,Re(N),Yt(J,N),N.group.visible=!0,G.add(N.group),gS(J,N),rt=0;for(const U of x.values()){if(U.state!=="ready")continue;const X=U.mesh.geometry;rt+=(X.index?.count||0)/3}fn()}function Re(N){N.roadVisuals&&(ze(N.roadVisuals),N.group.remove(N.roadVisuals),N.roadVisuals=null);const U=J.route;if(!U)return;const X=24,it={minX:N.x0-X,maxX:N.x0+ie+X,minZ:N.z0-X,maxZ:N.z0+ie+X},q=U.samples[0],ot=U.samples[U.samples.length-1],_t=vt=>vt.x>=it.minX&&vt.x<=it.maxX&&vt.z>=it.minZ&&vt.z<=it.maxZ,B=_t(q),at=_t(ot),et=B&&at?"both":B?"start":at?"finish":"none";N.roadVisuals=qf(U,J,{bounds:it,gates:et,posts:!0}),N.group.add(N.roadVisuals)}function Ln(N,U=!0){if(N.state!=="disposed"){if(N.state="disposed",U&&N.heights)for(T.set(N.key,{heights:N.heights,grid:_n,minH:N.minH,maxH:N.maxH});T.size>fS;){const X=T.keys().next().value;T.delete(X)}ze(N.group),N.group.parent&&N.group.parent.remove(N.group),N.geos.forEach(X=>X?.dispose()),N.geos=[null,null,null],N.mesh.parent&&N.mesh.parent.remove(N.mesh),N.mesh.geometry.dispose(),$=Math.max(0,$-(N.trees||0)),st=Math.max(0,st-(N.buildingGroup?.userData.count||0)),x.delete(N.key),rt=0;for(const X of x.values())X.state==="ready"&&(rt+=(X.mesh.geometry.index?.count||0)/3)}}function ze(N){N.traverse(U=>{U.geometry&&U.geometry.dispose(),U.material&&(Array.isArray(U.material)?U.material.forEach(X=>X.dispose()):U.material.dispose())})}function je(){for(;W<dS&&F.length;){let N=-1,U=1/0;for(let it=0;it<F.length;it++)F[it].state==="queued"&&F[it].priority<U&&(U=F[it].priority,N=it);if(N<0){F.splice(0,F.length);break}const X=F.splice(N,1)[0];X.state="loading",W++,He(X).catch(it=>{z||(X.attempts++,Gc.warn(`chunk ${X.key} failed (${X.attempts}/${Od}): ${it.message}`),X.attempts>=Od?X.state="failed":(X.state="queued",X.priority+=1e6,F.push(X)))}).finally(()=>{W--,z||(je(),fn())})}}function fn(){for(let N=H.length-1;N>=0;N--){const U=H[N];U.keys.every(it=>{const q=x.get(it);return q&&(q.state==="ready"||q.state==="failed"||q.state==="disposed")})?(H.splice(N,1),U.resolve()):U.onTick?.(Sn(U))}}function Sn(N){let U=0;for(const X of N.keys){const it=x.get(X);it&&(it.state==="ready"||it.state==="failed")&&U++}return U/Math.max(1,N.keys.length)}J.ensureReady=(N,U,{rings:X=1,onTick:it=null}={})=>{const q=Math.floor(N/ie),ot=Math.floor(U/ie),_t=[];for(let B=-X;B<=X;B++)for(let at=-X;at<=X;at++){const et=Ls(q+at,ot+B);_t.push(et),x.has(et)||We(q+at,ot+B,we({x0:(q+at)*ie,z0:(ot+B)*ie},N,U))}return je(),new Promise(B=>{_t.every(et=>{const vt=x.get(et);return vt&&(vt.state==="ready"||vt.state==="failed"||vt.state==="disposed")})?B():H.push({keys:_t,resolve:B,onTick:it})})},J.setFocus=(N,U)=>{j={x:N,z:U}},J.update=(N,U,X=0,it=0)=>{if(z)return;j={x:N,z:U};const q=Math.hypot(X,it),ot=Math.min(uS,q*3.5),_t=q>.01?1/q:0,B=N+X*_t*ot,at=U+it*_t*ot,et=Math.ceil(Fd/ie),vt=Math.floor(B/ie),gt=Math.floor(at/ie);for(let Ft=-et;Ft<=et;Ft++)for(let xt=-et;xt<=et;xt++){const kt=vt+xt,qt=gt+Ft,Pt=Ls(kt,qt);if(x.has(Pt))continue;const ne=kt*ie,Lt=qt*ie,Tn=Math.hypot(Math.max(ne-B,0,B-(ne+ie)),Math.max(Lt-at,0,at-(Lt+ie)));Tn>Fd||We(kt,qt,Tn+(xt===0&&Ft===0?-10:0))}for(const Ft of[...x.values()])if(Ft.state==="ready"&&we(Ft,N,U)>Ud)Ln(Ft);else if((Ft.state==="queued"||Ft.state==="loading")&&we(Ft,N,U)>Ud+ie&&Ft.state==="queued"){const xt=F.indexOf(Ft);xt>=0&&F.splice(xt,1),x.delete(Ft.key),Ft.state="disposed"}let mt=1;const Ot=[...x.values()].filter(Ft=>Ft.state==="ready").sort((Ft,xt)=>we(Ft,N,U)-we(xt,N,U));for(const Ft of Ot){if(mt<=0)break;const xt=jt(Ft,N,U);Ft.geos[xt]?ve(Ft,xt):(fe(Ft,xt),ve(Ft,xt),mt--)}je()},J.setRoute=N=>{J.route=N,J.routeIndex=Ad(N),Mt(N),yt(N);for(const U of[...x.values()])if(U.state==="ready"){if(Wt(U),ce(U),U.scatterGroup&&(ze(U.scatterGroup),U.group.remove(U.scatterGroup)),$=Math.max(0,$-(U.trees||0)),U.scatterGroup=zd(J,U),U.group.add(U.scatterGroup),$+=U.trees,U.buildingGroup&&(ze(U.buildingGroup),U.group.remove(U.buildingGroup),st=Math.max(0,st-(U.buildingGroup.userData.count||0)),U.buildingGroup=null),U.buildingPlacements){const X=Qf(U.buildingPlacements,J,J.routeIndex,go(U.ci,U.cj,23)*4294967296>>>0);X&&(U.buildingGroup=X,U.group.add(X),st+=X.userData.count||0)}Re(U)}te()};const K=512,tn=Math.max(g-p,w-y),Pe=(p+g)/2-tn/2,Ie=(y+w)/2-tn/2,Ct=document.createElement("canvas");Ct.width=K,Ct.height=K;const ke=Ct.getContext("2d");J.minimapCanvas=Ct,J.mapFromWorld=(N,U)=>({x:(N-Pe)/tn*K,y:(U-Ie)/tn*K});function Yt(N,U){const it=K/tn*Ce,q=N.mapFromWorld(U.x0,U.z0),ot=U.heights,_t=(et,vt)=>ot[zt(vt,0,bn)*_n+zt(et,0,bn)],B=new Qt,at=bn/48;for(let et=0;et<48;et++)for(let vt=0;vt<48;vt++){const gt=vt*at,mt=et*at,Ot=_t(gt,mt),Ft=(_t(gt+2,mt)-_t(gt-2,mt))/(2*Ce*2),xt=(_t(gt,mt+2)-_t(gt,mt-2))/(2*Ce*2),kt=zt(.72+(-Ft*.7-xt*.7)*1.2,.38,1.2);Ga(Ot,Math.hypot(Ft,xt),U.x0+gt*Ce,U.z0+mt*Ce,B),ke.fillStyle=`rgb(${zt(B.r*255*kt,0,255)|0},${zt(B.g*255*kt,0,255)|0},${zt(B.b*255*kt,0,255)|0})`,ke.fillRect(q.x+vt*it,q.y+et*it,it+.5,it+.5)}}function te(){ke.clearRect(0,0,K,K);for(const N of x.values())N.state==="ready"&&Yt(J,N)}e?.(.45,"Smoothing the master track…");const O=s.profile||"driving",R=gh(l,J,{name:`${pS[O]||"OSRM road"} stage`,source:"osrm",smooth:1,spacing:5,simplifyEpsilon:2,roadWidth:O==="driving"?4.8:3.4});if(R.length<20)throw new Error(`That road is too short to make a stage (${Math.round(R.length)} m).`);J.route=R,J.routeIndex=Ad(R),Mt(R),yt(R);const ht=R.samples[0];return e?.(.62,"Loading the first terrain chunks…"),await J.ensureReady(ht.x,ht.z,{rings:1,onTick:N=>e?.(.62+N*.3,"Loading the first terrain chunks…")}),Gc.info(`streamed world ready: ${(R.length/1e3).toFixed(2)} km route, corridor ${b}², spawn chunks loaded`),J}xe.enabled=!1;const an=Gs("game");ry();const Tt=s=>document.getElementById(s),Er=s=>Math.max(0,Math.min(1,s)),Di=Tt("game"),si=new UM({canvas:Di,antialias:!1,powerPreference:"high-performance",stencil:!1});si.setPixelRatio(1);si.setSize(window.innerWidth,window.innerHeight,!1);si.outputColorSpace=ho;si.shadowMap.enabled=!0;si.shadowMap.type=jr;const Oe=new vf;Oe.background=new Qt(12112604);Oe.fog=new lh(12835036,460,2900);const se=new ui(62,window.innerWidth/window.innerHeight,.35,9e3);se.position.set(-80,760,1100);const jf=new nt(-.42,.78,.46).normalize(),on=new B_(16773586,2.5);on.position.copy(jf).multiplyScalar(1300);on.castShadow=!0;on.shadow.mapSize.set(2048,2048);on.shadow.camera.left=-850;on.shadow.camera.right=850;on.shadow.camera.top=850;on.shadow.camera.bottom=-850;on.shadow.camera.near=10;on.shadow.camera.far=3600;on.shadow.bias=-7e-4;on.shadow.normalBias=.8;Oe.add(on);Oe.add(on.target);const xS=new U_(11850984,5527614,1.15);Oe.add(xS);const MS=new k_(9085090,.36);Oe.add(MS);function yS(){const s=new Ii({side:zn,depthWrite:!1,uniforms:{uTop:{value:new Qt(7120327)},uHorizon:{value:new Qt(14411487)},uSun:{value:jf.clone()}},vertexShader:`
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uSun;
      varying vec3 vPos;
      void main() {
        vec3 dir = normalize(vPos);
        float h = clamp(dir.y, 0.0, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(h, 0.58));
        float sd = max(dot(dir, uSun), 0.0);
        col += vec3(1.0, 0.80, 0.50) * pow(sd, 220.0) * 1.6;
        col += vec3(1.0, 0.78, 0.48) * pow(sd, 10.0) * 0.10;
        // A bank of pale haze just above the horizon.
        col = mix(col, vec3(0.89, 0.92, 0.90), smoothstep(0.09, 0.0, h) * 0.55);
        gl_FragColor = vec4(col, 1.0);
      }
    `}),t=new pe(new dh(6e3,24,12),s);return t.frustumCulled=!1,t}Oe.add(yS());const zs=new Ly(si);zs.resize(window.innerWidth,window.innerHeight);function tp(){const s=window.innerWidth,t=window.innerHeight;se.aspect=s/t,se.updateProjectionMatrix(),si.setSize(s,t,!1),zs.resize(s,t)}window.addEventListener("resize",tp);let bt=null,ln=null,_i=null,pt=null,Kt=null,ms=null,_s=null,Ms=null,Pi=null,di=null,wa=null,so=!1,qi=!1,Mr=!1,xo=0,cn="loading",gs=0,ba=0,Vc=-1,$i=null,Fa=0,xh=0,Mh=0,Ea="chase",ro=null,Wc=[],Le=!1,Ke=null,Je=null,Jn=!1,gi=0,gn=null,SS=yh(1592594996),Wa="driving";const oo=new Iy,Zi=new Set,Zn={throttle:0,brake:0,steer:0,handbrake:!1},Ns={throttle:0,brake:0,steer:0,handbrake:!1,jump:!1},ue={yaw:.72,pitch:.86,distance:1500,target:new nt(0,380,0)};function yh(s){let t=s>>>0;return function(){t|=0,t=t+1831565813|0;let i=Math.imul(t^t>>>15,1|t);return i=i+Math.imul(i^i>>>7,61|i)^i,((i^i>>>14)>>>0)/4294967296}}let Bd=0;function Ue(s,t=""){const e=Tt("toast");e.textContent=s,e.className=`show ${t}`.trim(),window.clearTimeout(Bd),Bd=window.setTimeout(()=>{e.className=""},t==="error"?6500:3800)}function Xi(s,t){Tt("loadingBar").style.width=`${Math.round(Er(s)*100)}%`,t&&(Tt("loadingText").textContent=t)}function ep(s=400){return new Promise(t=>{let e=!1;const i=()=>{e||(e=!0,t())};requestAnimationFrame(i),window.setTimeout(i,s)})}function qn(s){s.traverse(t=>{t.geometry&&t.geometry.dispose(),t.material&&(Array.isArray(t.material)?t.material.forEach(e=>e.dispose()):t.material.dispose())}),Oe.remove(s)}function np(s){return`rnr_best_${s.name}_${Math.round(s.length)}`}function ip(s){try{const t=localStorage.getItem(np(s));return t?Number(t):null}catch{return null}}function wS(s,t){try{localStorage.setItem(np(s),String(t))}catch{}}function Sh(){ln&&(ln.userData.dispose?.(),qn(ln),ln=null),di&&(qn(di),di=null),ln=an.time("build terrain LOD",()=>jM(bt)),Oe.add(ln),Pi&&(di=ZM(bt,Pi),di.visible=so,Oe.add(di)),Ms=$M(bt,Pi?.image||null);const s=ln.userData.stats?.();an.info(`terrain chunks ready: ${s?.chunks??0} chunks, ${s?.triangles??0} tris`)}function kd(s,t){if(bt?.streaming){bt.update(s,t,pt?pt.vel.x:0,pt?pt.vel.y:0);return}ln?.userData.update?.(s,t)}function ma(s,t=0,e=""){const i=Tt("worldLoading");i&&(i.classList.toggle("hidden",!s),Tt("worldBar").style.width=`${Math.round(Er(t)*100)}%`,e&&(Tt("worldStatus").textContent=e))}function bS(){bt?.streaming&&bt.dispose(),ms&&(qn(ms),ms=null),_s&&(qn(_s),_s=null),wa&&(qn(wa),wa=null),_i&&(qn(_i),_i=null),pt&&(qn(pt.group),qn(pt.dust.points),pt=null),ln&&(ln.userData.dispose?.(),qn(ln),ln=null),di&&(qn(di),di=null),Pi&&(Pi.dispose?.(),Pi=null),Ms=null,Kt=null}async function ES(s){const t=s.coordinates[Math.floor(s.coordinates.length/2)],e=`Stage at ${t.lat.toFixed(2)}°N ${t.lon.toFixed(2)}°E`;ma(!0,.02,"Planning the streamed world…");try{const i=await vS({geometry:s,title:e,onProgress:(a,l)=>ma(!0,a,l)});ma(!0,.95,"Warming up the stage…"),await ep(),bS(),bt=i,Pi=null,so=!1,Le&&Ss(),qa(),Oe.add(i.group),pt=new Yf(Oe,bt),_i=Wf(bt),Oe.add(_i),_s=null,ms=null,ln=null,Kt=i.route,Ms=i.minimapCanvas,pt.setRoute(Kt),Xc(),Zc(),Bs(),document.title=`Retro Norway Rally — ${e}`;const r=Tt("minimapLabel");r&&(r.innerHTML=`${e.replace("Stage at ","").toUpperCase()} <span>N↑</span>`);try{se.position.set(pt.pos.x-12,pt.pos.y+9,pt.pos.z+18),se.lookAt(pt.pos.x,pt.pos.y,pt.pos.z),si.compile(Oe,se),zs.render(Oe,se,xo)}catch(a){an.warn("streamed-world warm-up failed (continuing)",a)}return an.info(`streamed world ready: ${Kt.name}, ${Kt.length.toFixed(0)} m route`),{route:Kt,world:i}}finally{ma(!1)}}async function Mo(s){if(bt&&!bt.streaming&&s.coordinates.every(({lat:i,lon:r})=>{const a=bt.worldFromLatLon(i,r);return bt.inside(a.x,a.z,6)})){const i=vh(bt,s);return Le&&Ss(),Xa(i.route,{announce:!0}),{result:i,generated:!1}}const t=await ES(s);return Ue(`${t.route.name} — ${(t.route.length/1e3).toFixed(2)} km. Streamed world ready.`),{result:t,generated:!0}}function wh(s){so=!!s&&!!Pi,di&&(di.visible=so);const t=Tt("builderTopo");t&&(t.checked=so),s&&!Pi&&Ue("This scene has no topo basemap. The route picker still works on the 3D terrain.","error")}function Xc(){if(!Kt||!bt)return;$i=ip(Kt),Tt("stageName").textContent=Kt.name.toUpperCase(),Tt("stageLength").textContent=`${(Kt.length/1e3).toFixed(2)} KM`;const s=bt.latLonFromWorld(Kt.start.x,Kt.start.z),t=bt.latLonFromWorld(Kt.finish.x,Kt.finish.z);Tt("startCoord").textContent=Da(s),Tt("finishCoord").textContent=Da(t),Za(),Tt("osrmStatus").textContent="",Tt("osrmStatus").className="hint"}function Xa(s,{announce:t=!1,pad:e=!0}={}){if(bt?.streaming){an.time("stream setRoute",()=>bt.setRoute(s)),Kt=s,pt.setRoute(Kt),Ms=bt.minimapCanvas,Xc(),Zc(),Bs(),t&&Ue(`${Kt.name} — ${(Kt.length/1e3).toFixed(2)} km. Click START ENGINE or press Enter.`);return}e&&(bt.resetHeights(),bt.flattenPad(s.start.x,s.start.z,18,34),s.snapToTerrain());const i=an.time("carve road",()=>bt.carveRoad(s.samples,{halfWidth:s.roadWidth+1.2,blend:8}));s.snapToTerrain(),an.debug(`carved ${i} height samples for ${s.name}`),ln&&(e?Sh():ln.userData.refresh?.()),Kt=s,ms&&qn(ms),ms=qf(Kt,bt),Oe.add(ms),_s&&qn(_s),_s=qM(bt,Kt,yh(523124044)),Oe.add(_s),pt.setRoute(Kt),Xc(),Zc(),Bs(),t&&Ue(`${Kt.name} — ${(Kt.length/1e3).toFixed(2)} km. Click START ENGINE or press Enter.`)}function Za(){Tt("best").textContent=$i?`BEST ${Ia($i)}`:"BEST --:--.---"}function Bs({countdownNow:s=Mr}={}){!Kt||!pt||(cn=s?"countdown":"intro",gs=0,ba=3,Vc=-1,Fa=0,xh=0,Mh=0,pt.reset(Kt.startPose()),Tt("resultScreen").classList.add("hidden"),Tt("wrongWay").classList.remove("show"),Tt("timer").textContent="00:00.000",Tt("progressBar").style.width="0%",Za(),s||Tt("countdown").classList.remove("pop"))}function sp(){Mr=!0,Tt("startScreen").classList.add("hidden"),Tt("hud").classList.remove("hidden"),Bs({countdownNow:!0}),oo.start()}function TS(){if(cn!=="racing")return;cn="finished";const s=!$i||gs<$i;s&&($i=gs,wS(Kt,$i),Za()),Tt("resultTime").textContent=Ia(gs),Tt("resultBest").textContent=s?"★ NEW PERSONAL BEST ★":`PERSONAL BEST ${Ia($i)}`,Tt("resultMeta").textContent=`${Kt.name.toUpperCase()} · ${(Kt.length/1e3).toFixed(2)} KM · TOP ${Math.round(Fa*3.6)} KM/H · DRIFT ${xh.toFixed(1)} S · AIR ${Mh.toFixed(1)} S`,Tt("resultScreen").classList.remove("hidden"),Tt("wrongWay").classList.remove("show"),Ue("Stage complete. R to run it again, N for a new stage.")}async function bh(){if(bt){if(bt.streaming){if(!pt)return;Ue("Scouting a new streamed stage…");try{const s=bt.latLonFromWorld(pt.pos.x,pt.pos.z),t=Math.random()*Math.PI*2,e=1600+Math.random()*2600,i=bt.latLonFromWorld(pt.pos.x+Math.sin(t)*e,pt.pos.z+Math.cos(t)*e),r=await Va({a:s,b:i,profile:Wa});await Mo(r)}catch(s){Ue(s.message||"No road stage found from here. Try the 2D map.","error")}return}Tt("resultScreen").classList.add("hidden"),Ue("Scouting a new rally stage…"),setTimeout(()=>{try{bt.resetHeights();const s=py(bt,SS);Xa(s,{announce:!0})}catch(s){Sh(),Ue(s.message||"No stage found. Try the picker instead.","error")}},30)}}function AS(s){const t=new hn,e=new pe(new ni(.24,.32,7.4,6),new Hn({color:s}));e.position.y=3.7,t.add(e);const i=new pe(new ii(3,1.7),new Hn({color:s,side:$n,toneMapped:!1}));i.position.set(1.5,6.4,0),t.add(i);const r=new pe(new ni(1.7,1.7,.25,10),new Hn({color:s,toneMapped:!1}));return r.position.y=.12,t.add(r),t}function qa(){for(const s of Wc)Oe.remove(s),qn(s);Wc=[]}function Hd(s,t){const e=AS(t);e.position.set(s.x,bt.sample(s.x,s.z)+.1,s.z),Oe.add(e),Wc.push(e)}function ts(s,t=""){const e=Tt("builderStatus");e&&(e.textContent=s,e.className=`builder-status ${t}`.trim())}function ks(){const s=!!Ke,t=!!Je;Tt("builderStepA").classList.toggle("active",!s),Tt("builderStepA").classList.toggle("done",s),Tt("builderStepB").classList.toggle("active",s&&!t),Tt("builderStepB").classList.toggle("done",t),Tt("builderStepRoute").classList.toggle("active",s&&t);const e=s&&t&&!Jn;Tt("builderOsrm").disabled=!e,Tt("builderOffroad").disabled=!e,Tt("builderOsrm").textContent=Jn?"ROUTING…":"OSRM ROUTE",Tt("builderA").textContent=s?Da(bt.latLonFromWorld(Ke.x,Ke.z)):"—",Tt("builderB").textContent=t?Da(bt.latLonFromWorld(Je.x,Je.z)):"—"}function RS(){if(!bt)return;Eh();const s=Math.cos(ue.pitch),t=ue.target.x,e=ue.target.z,i=Math.max(bt.sample(t,e)+30,ue.target.y);ue.target.set(t,i,e);const r=t+Math.sin(ue.yaw)*s*ue.distance,a=e+Math.cos(ue.yaw)*s*ue.distance,l=Math.max(i+Math.sin(ue.pitch)*ue.distance,bt.sample(r,a)+20);se.position.set(r,l,a),se.lookAt(ue.target)}function rp(){if(!bt||Le)return;Le=!0,Jn=!1,gi++,Ke=null,Je=null,ro="start",qa(),wh(!0);const s=Kt?(Kt.start.x+Kt.finish.x)/2:0,t=Kt?(Kt.start.z+Kt.finish.z)/2:0,e=Eh();ue.target.set(zt(s,e.minX+100,e.maxX-100),bt.sample(s,t)+35,zt(t,e.minZ+100,e.maxZ-100)),ue.yaw=.72,ue.pitch=.86,ue.distance=1550,RS(),Tt("builderPanel").classList.remove("hidden"),Tt("hud").classList.add("building"),ts("Click the mountain to place the START point. Drag to orbit, right-drag to pan, wheel to zoom."),ks(),Ue("3D ROUTE BUILDER — pick a start and a finish, then let OSRM find the road.")}function Ss({restoreBasemap:s=!0}={}){Le=!1,Jn=!1,gi++,ro=null,gn=null,qa(),Tt("builderPanel").classList.add("hidden"),Tt("hud").classList.remove("building"),s&&wh(!1)}function op(s){Ss(),Xa(s,{announce:!0})}async function ap(){if(!Ke||!Je||Jn||!bt)return;const s=++gi;Jn=!0,ks();const t=Tt("builderProfile").value;ts(`Asking OSRM (${t}) for a road between the two points…`);const e=bt.latLonFromWorld(Ke.x,Ke.z),i=bt.latLonFromWorld(Je.x,Je.z);try{const r=await Na({a:e,b:i,profile:t});Wa=t;const a=vh(bt,r,{requireInside:!bt.streaming});if(!Le||s!==gi)return;const l=a.snapped?.a!=null?` · snap ${Math.round(a.snapped.a)} m / ${Math.round(a.snapped.b)} m`:"";ts(`OSRM found ${(a.distance/1e3).toFixed(2)} km in ${Math.round(a.duration/60)} min${l}.`,"ok"),op(a.route)}catch(r){if(!Le||s!==gi)return;ts(`${r.message} The OFF-ROAD ROUTE button is still available.`,"err"),Ue(r.message,"error")}finally{s===gi&&(Jn=!1,Le&&ks())}}function PS(){if(!Ke||!Je||Jn||!bt)return;const s=++gi;Jn=!0,ks(),ts("Routing across the mountain with the off-road A* router…");const t={...Ke},e={...Je},i=bt.streaming?{minX:Math.min(t.x,e.x)-2400,maxX:Math.max(t.x,e.x)+2400,minZ:Math.min(t.z,e.z)-2400,maxZ:Math.max(t.z,e.z)+2400}:null;setTimeout(()=>{try{const r=vo(bt,t,e,{name:"Custom A↔B Stage",window:i});if(!Le||s!==gi)return;op(r)}catch(r){if(!Le||s!==gi)return;ts(`${r.message} Try two points on gentler ground.`,"err"),Ue(r.message||"Those points are not connected by drivable ground.","error")}finally{s===gi&&(Jn=!1,Le&&ks())}},30)}const Gd=new G_,ql=new le;function Eh(){return bt?.streaming?bt.bounds:bt?{minX:-bt.sizeX/2,maxX:bt.sizeX/2,minZ:-bt.sizeZ/2,maxZ:bt.sizeZ/2}:{minX:-1,maxX:1,minZ:-1,maxZ:1}}function CS(s){if(!bt)return null;const t=bt.streaming?bt.pickables():ln?.userData.pickables||[ln];if(!t.length)return Ue("That part of the world is still streaming in. Try again in a moment.","error"),null;const e=Di.getBoundingClientRect();ql.x=(s.clientX-e.left)/e.width*2-1,ql.y=-((s.clientY-e.top)/e.height)*2+1,Gd.setFromCamera(ql,se);const i=Gd.intersectObjects(t,!1);if(!i.length)return Ue("Click directly on the mountain, not the sky.","error"),null;const r=i[0].point;return r.y<3?(Ue("That is the fjord. Pick dry ground.","error"),null):bt.slope(r.x,r.z)>.9?(Ue("That face is a cliff. Pick gentler ground.","error"),null):{x:r.x,z:r.z}}function LS(s){if(!Le||!ro)return;const t=CS(s);if(t){if(!Ke||Ke&&Je){gi++,Jn=!1,qa(),Ke=t,Je=null,Hd(Ke,8118414),ro="finish",ts("Start set. Now click the FINISH point on the map."),ks();return}Je=t,Hd(Je,16763210),ro="start",ks(),ts("Both points set. Asking OSRM for a road…"),ap()}}function IS(s){if(Le&&!(s.button!==0&&s.button!==2)){gn={id:s.pointerId,button:s.button,lastX:s.clientX,lastY:s.clientY,moved:0};try{Di.setPointerCapture(s.pointerId)}catch{}s.preventDefault()}}function DS(s){if(!Le||!gn||s.pointerId!==gn.id)return;const t=s.clientX-gn.lastX,e=s.clientY-gn.lastY;if(gn.lastX=s.clientX,gn.lastY=s.clientY,gn.moved+=Math.abs(t)+Math.abs(e),!(gn.moved<4))if(gn.button===0)ue.yaw-=t*.006,ue.pitch=zt(ue.pitch+e*.004,.22,1.38);else{const i=ue.distance*.00135,r=Eh(),a=Math.cos(ue.yaw),l=Math.sin(ue.yaw);ue.target.x+=(-a*t+l*e)*i,ue.target.z+=(l*t+a*e)*i,ue.target.x=zt(ue.target.x,r.minX+80,r.maxX-80),ue.target.z=zt(ue.target.z,r.minZ+80,r.maxZ-80),ue.target.y=bt.sample(ue.target.x,ue.target.z)+35}}function NS(s){if(!Le||!gn||s.pointerId!==gn.id)return;const t=gn.moved<6&&gn.button===0,e=gn.id;gn=null;try{Di.releasePointerCapture(e)}catch{}t&&LS(s)}function FS(s){Le&&(s.preventDefault(),ue.distance=zt(ue.distance*Math.exp(s.deltaY*.0012),230,3800))}const lp=Tt("minimap"),Ht=lp.getContext("2d"),Ri=lp.width;function Ei(s,t){return bt?.streaming?bt.mapFromWorld(s,t):{x:(s+bt.sizeX/2)/bt.sizeX*Ri,y:(t+bt.sizeZ/2)/bt.sizeZ*Ri}}function Zc(){if(!Kt)return;Ht.clearRect(0,0,Ri,Ri),Ms&&Ht.drawImage(Ms,0,0,Ri,Ri);const s=Kt.samples;Ht.lineJoin="round",Ht.lineCap="round",Ht.strokeStyle="rgba(0,0,0,.65)",Ht.lineWidth=6,Ht.beginPath();for(let i=0;i<s.length;i+=2){const r=Ei(s[i].x,s[i].z);i===0?Ht.moveTo(r.x,r.y):Ht.lineTo(r.x,r.y)}Ht.stroke(),Ht.strokeStyle="#f0ce58",Ht.lineWidth=2.4,Ht.stroke();const t=Ei(Kt.start.x,Kt.start.z);Ht.fillStyle="#8fe6a3",Ht.beginPath(),Ht.arc(t.x,t.y,4,0,Math.PI*2),Ht.fill(),Ht.strokeStyle="#101513",Ht.lineWidth=1.5,Ht.stroke();const e=Ei(Kt.finish.x,Kt.finish.z);Ht.fillStyle="#f0ce58",Ht.fillRect(e.x-4,e.y-4,8,8),Ht.strokeStyle="#101513",Ht.strokeRect(e.x-4,e.y-4,8,8)}function US(){if(!Kt||!pt||!bt)return;Ht.clearRect(0,0,Ri,Ri),Ms&&Ht.drawImage(Ms,0,0,Ri,Ri);const s=Kt.samples;Ht.lineJoin="round",Ht.lineCap="round",Ht.strokeStyle="rgba(0,0,0,.68)",Ht.lineWidth=6,Ht.beginPath();for(let h=0;h<s.length;h+=2){const u=Ei(s[h].x,s[h].z);h===0?Ht.moveTo(u.x,u.y):Ht.lineTo(u.x,u.y)}Ht.stroke(),Ht.strokeStyle="#f0ce58",Ht.lineWidth=2.4,Ht.stroke();const t=Ei(Kt.start.x,Kt.start.z);Ht.fillStyle="#8fe6a3",Ht.beginPath(),Ht.arc(t.x,t.y,4,0,Math.PI*2),Ht.fill();const e=Ei(Kt.finish.x,Kt.finish.z);if(Ht.fillStyle="#f0ce58",Ht.fillRect(e.x-4,e.y-4,8,8),Ht.strokeStyle="#101513",Ht.lineWidth=1.5,Ht.strokeRect(e.x-4,e.y-4,8,8),Le){if(Ke&&Je){const h=Ei(Ke.x,Ke.z),u=Ei(Je.x,Je.z);Ht.strokeStyle="rgba(255,255,255,.75)",Ht.setLineDash([4,4]),Ht.lineWidth=1.5,Ht.beginPath(),Ht.moveTo(h.x,h.y),Ht.lineTo(u.x,u.y),Ht.stroke(),Ht.setLineDash([])}for(const[h,u]of[[Ke,"#8fe6a3"],[Je,"#ffc94a"]]){if(!h)continue;const d=Ei(h.x,h.z);Ht.fillStyle=u,Ht.beginPath(),Ht.arc(d.x,d.y,5,0,Math.PI*2),Ht.fill(),Ht.strokeStyle="#101513",Ht.lineWidth=1.5,Ht.stroke()}}const i=Ei(pt.pos.x,pt.pos.z),r=pt.forward(),a=-r.z,l=r.x;Ht.fillStyle="#f4efe0",Ht.strokeStyle="#0a0e0b",Ht.lineWidth=1.5,Ht.beginPath(),Ht.moveTo(i.x+r.x*7,i.y+r.z*7),Ht.lineTo(i.x-r.x*4+a*4,i.y-r.z*4+l*4),Ht.lineTo(i.x-r.x*4-a*4,i.y-r.z*4-l*4),Ht.closePath(),Ht.fill(),Ht.stroke()}const _a=new nt(0,0,0),Pn=new nt,mr=new nt;function OS(s){const t=Math.cos(ue.pitch),e=ue.target;bt?.streaming&&bt.setFocus(e.x,e.z);const i=new nt(e.x+Math.sin(ue.yaw)*t*ue.distance,e.y+Math.sin(ue.pitch)*ue.distance,e.z+Math.cos(ue.yaw)*t*ue.distance),r=bt.sample(i.x,i.z)+20;i.y<r&&(i.y=r),se.position.lerp(i,1-Math.exp(-9*s));const a=bt.sample(e.x,e.z)+30;e.y<a&&(e.y=Fn(e.y,a,8,s)),se.lookAt(e);const l=Fn(se.fov,56,4,s);Math.abs(se.fov-l)>.01&&(se.fov=l,se.updateProjectionMatrix())}function zS(s){if(!pt||!bt)return;if(Le){OS(s);return}const t=pt.forward();if(!Mr||cn==="intro"){const e=xo*.09+.6,i=24;Pn.set(pt.pos.x+Math.cos(e)*i,pt.pos.y+10.5,pt.pos.z+Math.sin(e)*i);const r=bt.sample(Pn.x,Pn.z)+2.2;Pn.y=Math.max(Pn.y,r),se.position.lerp(Pn,1-Math.exp(-2.2*s)),mr.set(pt.pos.x,pt.pos.y+1.3,pt.pos.z),_a.lerp(mr,1-Math.exp(-4*s)),se.lookAt(_a)}else if(Ea==="hood")se.position.set(pt.pos.x+t.x*.5,pt.pos.y+1.55,pt.pos.z+t.z*.5),mr.set(pt.pos.x+t.x*22,pt.pos.y+1.6,pt.pos.z+t.z*22),se.lookAt(mr),se.fov=Fn(se.fov,68,4,s),se.updateProjectionMatrix();else{const e=pt.speed;let i=7+e*.045;const r=2.8+e*.018;for(let _=0;_<5;_++){const p=pt.pos.x-t.x*i,g=pt.pos.z-t.z*i;if(bt.sample(p,g)<pt.pos.y+2)break;i*=.72}Pn.set(pt.pos.x-t.x*i,pt.pos.y+r,pt.pos.z-t.z*i);let a=-1/0;for(let _=0;_<=8;_++){const p=_/8,g=pt.pos.x+(Pn.x-pt.pos.x)*p,y=pt.pos.z+(Pn.z-pt.pos.z)*p;a=Math.max(a,bt.sample(g,y))}const l=pt.pos.y+8+Math.min(2,e*.04);Pn.y<a+1.4&&(Pn.y=Math.min(a+1.4,l));const h=bt.sample(Pn.x,Pn.z);Pn.y<h+1.2&&(Pn.y=Math.min(h+1.2,l+2)),se.position.lerp(Pn,1-Math.exp(-5.4*s));const u=bt.sample(se.position.x,se.position.z)+1.1;if(se.position.y<u&&(se.position.y=Fn(se.position.y,u,16,s)),pt.speed>6&&(!pt.onRoad||!pt.grounded)){const _=Math.min(.12,pt.speed*.0035)*(pt.onRoad?.45:1);se.position.x+=(Math.random()-.5)*_,se.position.y+=(Math.random()-.5)*_,se.position.z+=(Math.random()-.5)*_}const d=4+e*.05;mr.set(pt.pos.x+t.x*d,pt.pos.y+1.15+Math.min(1.2,e*.015),pt.pos.z+t.z*d),_a.lerp(mr,1-Math.exp(-9*s)),se.lookAt(_a);const m=60+Math.min(16,e*.32);Math.abs(se.fov-m)>.05&&(se.fov=Fn(se.fov,m,4,s),se.updateProjectionMatrix())}}const Ua={KeyW:"up",ArrowUp:"up",KeyS:"down",ArrowDown:"down",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",Space:"jump",ShiftLeft:"handbrake",ShiftRight:"handbrake"};let Vd=!1;window.addEventListener("keydown",s=>{Ua[s.code]&&(Zi.add(Ua[s.code]),(s.code==="Space"||s.code.startsWith("Arrow"))&&s.preventDefault()),s.code==="KeyR"&&qi&&Mr&&!Le&&(Bs({countdownNow:!0}),Ue("Stage restarted.")),s.code==="KeyC"&&(Le||(Ea=Ea==="chase"?"hood":"chase",Ue(Ea==="hood"?"Bonnet camera.":"Chase camera."))),s.code==="KeyM"&&(oo.setMuted(!oo.muted),Ue(oo.muted?"Sound off.":"Sound on.")),s.code==="KeyQ"&&pt&&qi&&(pt.shift(pt.gear>1?pt.gear-1:pt.gear),pt.autoShift&&(pt.autoShift=!1,Ue("Manual gearbox. Q/E shift, G returns to automatic."))),s.code==="KeyE"&&pt&&qi&&(pt.shift(pt.gear+1),pt.autoShift&&(pt.autoShift=!1,Ue("Manual gearbox. Q/E shift, G returns to automatic."))),s.code==="KeyG"&&pt&&(pt.autoShift=!pt.autoShift,Ue(pt.autoShift?"Automatic gearbox.":"Manual gearbox. Q/E shift.")),s.code==="KeyN"&&qi&&Mr&&!Le&&bh(),s.code==="Escape"&&Le&&Ss(),s.code==="Enter"&&qi&&!Mr&&sp(),s.code==="F3"&&(s.preventDefault(),cp())});window.addEventListener("keyup",s=>{Ua[s.code]&&Zi.delete(Ua[s.code])});window.addEventListener("blur",()=>Zi.clear());for(const s of document.querySelectorAll("[data-touch]")){const t=s.dataset.touch,e=r=>{r.preventDefault(),s.setPointerCapture?.(r.pointerId),t==="left"?Zn.steer=-1:t==="right"?Zn.steer=1:t==="throttle"?Zn.throttle=1:t==="brake"?Zn.brake=1:t==="handbrake"&&(Zn.handbrake=!0)},i=r=>{r.preventDefault(),t==="left"||t==="right"?Zn.steer=0:t==="throttle"?Zn.throttle=0:t==="brake"?Zn.brake=0:t==="handbrake"&&(Zn.handbrake=!1)};s.addEventListener("pointerdown",e),s.addEventListener("pointerup",i),s.addEventListener("pointercancel",i),s.addEventListener("pointerleave",i)}function BS(){let s=0,t=0,e=0;Zi.has("left")&&(s-=1),Zi.has("right")&&(s+=1),Zi.has("up")&&(t=1),Zi.has("down")&&(e=1),s+=Zn.steer,t=Math.max(t,Zn.throttle),e=Math.max(e,Zn.brake),Ns.steer=zt(-s,-1,1),Ns.throttle=Er(t),Ns.brake=Er(e),Ns.handbrake=Zi.has("handbrake")||Zn.handbrake;const i=Zi.has("jump");Ns.jump=i&&!Vd,Vd=i}function kS(){if(!pt)return;const s=Math.round(pt.speed*3.6);Tt("speed").textContent=String(Math.min(999,s)).padStart(3,"0");const t=pt.gear===0?"R":String(pt.gear);Tt("gear").textContent=pt.autoShift?t:`${t}·M`,Tt("rpmFill").style.width=`${Er((pt.rpm-900)/5900)*100}%`,Tt("rpmText").textContent=String(Math.round(pt.rpm/100)*100);const e=Tt("surface");pt.grounded?pt.onRoad?(e.textContent=pt.drifting?"DRIFT":"GRAVEL",e.className=pt.drifting?"off":"road"):(e.textContent="OFF ROAD",e.className="off"):(e.textContent="AIRBORNE",e.className="air"),Tt("timer").textContent=Ia(gs),cn==="racing"&&(Tt("progressBar").style.width=`${Er(pt.progress)*100}%`),Tt("wrongWay").classList.toggle("show",pt.wrongWay&&cn==="racing")}function HS(){Kt&&($i=ip(Kt),Za())}function GS(s){if(!Le)if(cn==="countdown"){ba-=s;const t=Math.ceil(ba);if(t!==Vc&&t>=0){Vc=t;const e=Tt("countdown");e.textContent=t>0?String(t):"GO!",e.classList.remove("pop"),e.offsetWidth,e.classList.add("pop"),t===0&&Ue("Go! Keep it on the mountain.")}ba<=0&&(cn="racing",gs=0,Tt("countdown").textContent="")}else cn==="racing"&&(gs+=s,Fa=Math.max(Fa,pt.speed),pt.drifting&&(xh+=s),pt.grounded||(Mh+=s))}function VS(s){_i&&(_i.userData.material.uniforms.uTime.value=xo),bt?.streaming&&_i&&pt&&_i.position.set(Math.round(pt.pos.x/64)*64,.45,Math.round(pt.pos.z/64)*64),pt&&(on.position.set(pt.pos.x-650,pt.pos.y+900,pt.pos.z+470),on.target.position.set(pt.pos.x,pt.pos.y,pt.pos.z),on.target.updateMatrixWorld())}async function WS(){const s=new URLSearchParams(location.search).get("scene");let t=[];try{const h=await fetch("/terrain/scenes/index.json");h.ok&&(t=await h.json())}catch{t=[]}(!Array.isArray(t)||!t.length)&&(t=[{name:"preikestolen",title:"Preikestolen (demo)",path:"scenes/preikestolen/"}]);const e=t.find(h=>h.name===s)||t[0];let i=String(e.path||`scenes/${e.name}/`).replace(/^\/+/,"");i.endsWith("/")||(i+="/");const r=`/terrain/${i}`;let a=null;try{const h=await fetch(`${r}scene.json`);h.ok&&(a=await h.json())}catch{a=null}let l="dtm_1m.tif";try{const h=await fetch(`${r}index.json`);if(h.ok){const d=(await h.json()).files||[];l=d.includes("dtm_1m.tif")?"dtm_1m.tif":d.includes("dtm_10m.tif")?"dtm_10m.tif":l}}catch{}return{entry:e,base:r,sceneMeta:a,tif:l}}async function XS(){const s=performance.now();an.info("boot: start");try{Xi(.02,"Reading the 3d_terrain scene catalog…");const{entry:t,base:e,sceneMeta:i,tif:r}=await WS();an.info(`boot: scene ${t.name} at ${e}`),Xi(.05,`Opening ${t.title||t.name}…`);const a=i?.basemap?.file;bt=await an.timeAsync("load terrain",()=>WM({sceneUrl:`${e}scene.json`,tifUrl:`${e}${r}`,basemapUrl:a?`${e}${a}`:null,onProgress:(h,u)=>Xi(h,u)})),an.info(`boot: terrain ${bt.sizeX.toFixed(0)}×${bt.sizeZ.toFixed(0)} m, ${bt.grid}² samples`),bt.basemapUrl&&(Xi(.84,"Draping the Kartverket topo map…"),Pi=await XM(bt.basemapUrl)),Xi(.86,"Plotting the rally stage…");const l=an.time("initial route",()=>vo(bt,{x:-710,z:288},{x:104,z:-245},{name:"Preikestolen Climb"}));bt.flattenPad(l.start.x,l.start.z,18,34),l.snapToTerrain(),Xi(.9,"Sculpting the low-poly mountain…"),Sh(),_i=Wf(bt),Oe.add(_i),pt=new Yf(Oe,bt),Xa(l,{pad:!1}),wa=ZS(),Xi(.96,"Warming up shaders and shadows…"),await ep();try{se.position.set(pt.pos.x-12,pt.pos.y+9,pt.pos.z+18),se.lookAt(pt.pos.x,pt.pos.y,pt.pos.z),si.compile(Oe,se),zs.render(Oe,se,0),zs.render(Oe,se,0)}catch(h){an.warn("warm-up render failed (continuing)",h)}document.title=`Retro Norway Rally — ${t.title||"Preikestolen"}`,qi=!0,cn="intro",Xi(1,"Ready."),Tt("startBtn").disabled=!1,Tt("startBtn").textContent="START ENGINE",Tt("startBtn").focus(),an.info(`boot: ready in ${(performance.now()-s).toFixed(0)} ms`)}catch(t){an.error(`boot failed after ${(performance.now()-s).toFixed(0)} ms`,t),console.error(t),Xi(1,"The mountain did not load."),Tt("loadingText").textContent=`Could not load the terrain: ${t.message}. Run this with “npm run dev” and open the local address.`,Tt("loadingText").style.color="#ff9b84"}}function ZS(){const s=yh(12648430),t=new hn,e=new qe({color:8690082,flatShading:!0}),i=new qe({color:10005425,flatShading:!0}),r=Math.max(2800,(bt?.sizeX??2e3)*.95);for(let a=0;a<18;a++){const l=a/18*Math.PI*2+s()*.18,h=r+s()*1900,u=180+s()*520,d=450+s()*500,m=new Pr(d,u,5+Math.floor(s()*3),1),_=new pe(m,a%2?e:i);_.position.set(Math.cos(l)*h,u/2-6,Math.sin(l)*h),_.rotation.y=s()*Math.PI*2,_.scale.z=.7+s()*.8,t.add(_)}return t.name="distantPeaks",Oe.add(t),t}Tt("startBtn").addEventListener("click",sp);Tt("newStage").addEventListener("click",bh);Tt("restart").addEventListener("click",()=>{Bs({countdownNow:!0}),Ue("Stage restarted.")});Tt("routeBuilder").addEventListener("click",()=>{Le?Ss():rp()});Tt("resultRestart").addEventListener("click",()=>{Bs({countdownNow:!0})});Tt("resultNew").addEventListener("click",bh);Tt("builderClose").addEventListener("click",()=>Ss());Tt("builderOsrm").addEventListener("click",ap);Tt("builderOffroad").addEventListener("click",PS);Tt("builderTopo").addEventListener("change",()=>wh(Tt("builderTopo").checked));Tt("builderProfile").addEventListener("change",()=>{Ke&&Je&&!Jn&&ts(`Profile set to ${Tt("builderProfile").value}. Press OSRM ROUTE to try it.`)});Tt("osrmFill").addEventListener("click",()=>{if(!Kt||!bt)return;const s=Ke||Kt.start,t=Je||Kt.finish,e=bt.latLonFromWorld(s.x,s.z),i=bt.latLonFromWorld(t.x,t.z);Tt("osrmALat").value=e.lat.toFixed(6),Tt("osrmALon").value=e.lon.toFixed(6),Tt("osrmBLat").value=i.lat.toFixed(6),Tt("osrmBLon").value=i.lon.toFixed(6),Tt("osrmStatus").textContent=Ke&&Je?"Coordinates filled from the two route-builder points. Hit FETCH.":"Coordinates filled from the current stage. Hit FETCH.",Tt("osrmStatus").className="hint"});Tt("osrmGo").addEventListener("click",async()=>{if(!bt)return;const s={lat:Number(Tt("osrmALat").value),lon:Number(Tt("osrmALon").value)},t={lat:Number(Tt("osrmBLat").value),lon:Number(Tt("osrmBLon").value)};if(![s.lat,s.lon,t.lat,t.lon].every(Number.isFinite)){Tt("osrmStatus").textContent="Enter four coordinates (latitude and longitude).",Tt("osrmStatus").className="hint err";return}Tt("osrmStatus").textContent="Asking OSRM for a road…",Tt("osrmStatus").className="hint";try{if(!kc(s.lat,s.lon)||!kc(t.lat,t.lon))throw new Error("Those coordinates are outside Norway. The generator covers Norway only.");const e=Tt("osrmProfile").value;Wa=e;const i=await Va({a:s,b:t,profile:e}),{result:r,generated:a}=await Mo(i),l=r.snapped?.a!=null?` · snap ${Math.round(r.snapped.a)} m / ${Math.round(r.snapped.b)} m`:"";Tt("osrmStatus").textContent=`OSRM: ${(r.distance/1e3).toFixed(2)} km, ${Math.round(r.duration/60)} min (${r.profile})${l}.`,Tt("osrmStatus").className="hint ok",a&&(Tt("osrmStatus").textContent+=" Streamed world ready.")}catch(e){Tt("osrmStatus").textContent=e.message,Tt("osrmStatus").className="hint err",Ue(e.message,"error")}});const qc=jy({getTerrain:()=>bt,onRoute:async({a:s,b:t,profile:e})=>{const i=performance.now();try{const r=await Va({a:s,b:t,profile:e});Wa=e,an.info(`2D map OSRM geometry in ${(performance.now()-i).toFixed(0)} ms (${r.distance.toFixed(0)} m, ${r.coordinates.length} points${r.segmented?`, ${r.segmented.hops} segments`:""})`);const{result:a,generated:l}=await Mo(r),h=a.snapped?.a!=null?` · snap ${Math.round(a.snapped.a)} m / ${Math.round(a.snapped.b)} m`:"";return{ok:!0,message:`OSRM: ${(a.distance/1e3).toFixed(2)} km, ${Math.round(a.duration/60)} min${h}.`+(l?" Streamed world ready.":"")}}catch(r){return an.warn(`2D map route failed: ${r.message}`),{ok:!1,message:r.message}}}});Tt("mapPickerBtn").addEventListener("click",()=>{if(!qi||!bt){Ue("The mountain is still loading.","error");return}Le&&Ss(),qc.open(bt,Kt)});Di.addEventListener("pointerdown",IS);Di.addEventListener("pointermove",DS);Di.addEventListener("pointerup",NS);Di.addEventListener("pointercancel",()=>{gn=null});Di.addEventListener("wheel",FS,{passive:!1});Di.addEventListener("contextmenu",s=>{Le&&s.preventDefault()});let $c=!1;function qS(s){$c||($c=!0,an.warn(`reducing quality after ${s?.toFixed?.(1)??"?"} fps: lower render scale, smaller shadow map`),zs.setPixelScale(.34),on.shadow.mapSize.set(1024,1024),on.shadow.map&&(on.shadow.map.dispose(),on.shadow.map=null),si.setPixelRatio(.8),tp(),Ue("Low frame rate detected — reduced detail so the stage stays playable.","error"))}const Us=new oy({lowFps:24,onLowFps:qS}),Vs=document.createElement("pre");Vs.id="debugPanel";Vs.className="hidden";Vs.setAttribute("aria-live","off");document.body.appendChild(Vs);const $l=(new URLSearchParams(location.search).get("debug")||"").toLowerCase();let gr=$l==="1"||$l==="true"||$l==="on";gr&&Vs.classList.remove("hidden");let Wd=0;function cp(){gr=!gr,Vs.classList.toggle("hidden",!gr),an.info(`debug overlay ${gr?"on":"off"}`)}function $S(s){if(!gr||s<Wd)return;Wd=s+500;const t=si.info.render,e=ln?.userData.stats?.()??{},i=bt?.streaming?bt.stats():null,r=performance.memory?`${(performance.memory.usedJSHeapSize/1048576).toFixed(0)} / ${(performance.memory.jsHeapSizeLimit/1048576).toFixed(0)} MB`:"n/a",a=pt?`${(pt.speed*3.6).toFixed(0)} km/h  gear ${pt.gear===0?"R":pt.gear}${pt.autoShift?" (auto)":" (manual)"}  ${Math.round(pt.rpm)} rpm  ${pt.grounded?"ground":"AIR"}  ${pt.onRoad?"road":"gravel"}`:"not loaded",l=pt?`${pt.pos.x.toFixed(0)}, ${pt.pos.y.toFixed(1)}, ${pt.pos.z.toFixed(0)}`:"—",h=i?`stream     ${i.ready} chunks ready · ${i.loading} loading · ${i.queued} queued · ${i.triangles.toLocaleString()} tris · ${i.trees} trees · ${i.houses} houses`:`terrain    ${e.chunks??0} chunks  ${(e.triangles??0).toLocaleString()} tris  LOD ${JSON.stringify(e.levels??{})}`;Vs.textContent=["RETRO NORWAY RALLY · debug (F3)",`fps        ${Us.fps.toFixed(1)}   frame ${Us.frameMs.toFixed(1)} ms   worst ${Us.worstMs.toFixed(0)} ms   long ${Us.longFrames}`,`draw calls ${t.calls}   tris ${t.triangles.toLocaleString()}   points ${t.points}`,h,`car        ${a}`,`position   ${l}   phase ${cn}`,`memory     ${r}   quality ${$c?"reduced":"full"}`].join(`
`)}let Xd=performance.now();function hp(s){Us.begin(s);const t=Math.min(.05,Math.max(1e-4,(s-Xd)/1e3));if(Xd=s,xo+=t,BS(),pt&&qi){const i=cn==="countdown"||cn==="intro"||Le?{throttle:0,brake:0,steer:0,handbrake:!1,jump:!1,frozen:!0}:Ns;if(pt.update(t,i),cn==="racing"&&pt){const r=pt.pos.x-Kt.finish.x,a=pt.pos.z-Kt.finish.z,l=Math.hypot(r,a);pt.progress>.94&&l<13&&TS()}cn==="finished"&&pt.vel.multiplyScalar(Math.exp(-2.2*t)),kS(),oo.update({speed:pt.speed,throttle:cn==="racing"&&!Le?Ns.throttle:0,onRoad:pt.onRoad,drifting:pt.drifting,running:!Le&&(cn==="racing"||cn==="countdown")})}qi&&(GS(t),VS(),pt?kd(pt.pos.x,pt.pos.z):kd(se.position.x,se.position.z),zS(t),US()),zs.render(Oe,se,xo),Us.sample(s),$S(s),requestAnimationFrame(hp)}XS();requestAnimationFrame(hp);window.addEventListener("focus",HS);window.__rally={scene:Oe,camera:se,get terrain(){return bt},get car(){return pt},get route(){return Kt},get phase(){return cn},get stageTime(){return gs},get builder(){return{active:Le,a:Ke,b:Je,busy:Jn}},openRouteBuilder:rp,closeRouteBuilder:Ss,openMap:()=>qc.open(bt,Kt),mapPicker:qc,toggleDebug:cp,dumpLog:sy,perf:Us,renderer:si,terrainStats:()=>ln?.userData.stats?.(),generateRoute:(s,t,e)=>vo(bt,s,t,e),fetchOsrm:async s=>{const t=await Na(s);return vh(bt,t)},driveGeometry:s=>Mo(s),driveRoute:async(s,t,e="driving")=>{const i=await Va({a:s,b:t,profile:e});return Mo(i)},generateWorld:s=>Yy(s),streamStats:()=>bt?.streaming?bt.stats():null,screenFromWorld(s,t){se.updateMatrixWorld();const e=new nt(s,bt.sample(s,t),t).project(se);return{x:(e.x*.5+.5)*window.innerWidth,y:(-e.y*.5+.5)*window.innerHeight}}};
