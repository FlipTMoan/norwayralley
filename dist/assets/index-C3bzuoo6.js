(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))n(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&n(a)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();const go="187",Cu=0,ll=1,Pu=2,_s=1,Lu=2,ms=3,ti=0,je=1,_n=2,$i=0,xs=1,cl=2,ul=3,hl=4,Du=5,qi=100,Iu=101,Nu=102,Uu=103,Fu=104,Ou=200,Bu=201,zu=202,Gu=203,Sc=204,yc=205,Hu=206,ku=207,Vu=208,Wu=209,Xu=210,qu=211,Yu=212,$u=213,Ku=214,ya=0,Ea=1,Ta=2,ys=3,ba=4,wa=5,Aa=6,Ra=7,_o=0,Zu=1,Ju=2,Jn=0,Ec=1,Tc=2,bc=3,wc=4,Ac=5,Rc=6,Cc=7,Pc=300,ji=301,Es=302,Wr=303,Xr=304,Ca=1e3,Kn=1001,Pa=1002,ye=1003,Qu=1004,Os=1005,Qe=1006,qr=1007,Zn=1008,ln=1009,Lc=1010,Dc=1011,Ts=1012,xo=1013,Bn=1014,bn=1015,zn=1016,vo=1017,Mo=1018,ts=1020,Ic=35902,Nc=35899,Uc=1021,Fc=1022,Un=1023,gi=1026,pi=1027,So=1028,yo=1029,wi=1030,Eo=1031,To=1033,dr=33776,fr=33777,pr=33778,mr=33779,La=35840,Da=35841,Ia=35842,Na=35843,Ua=36196,Fa=37492,Oa=37496,Ba=37488,za=37489,yr=37490,Ga=37491,Ha=37808,ka=37809,Va=37810,Wa=37811,Xa=37812,qa=37813,Ya=37814,$a=37815,Ka=37816,Za=37817,Ja=37818,Qa=37819,ja=37820,to=37821,eo=36492,no=36494,io=36495,so=36283,ro=36284,Er=36285,ao=36286,ju=3200,oo=0,th=1,hi="",Ye="srgb",bs="srgb-linear",Tr="linear",re="srgb",Yr=7680,eh=519,nh=512,ih=513,sh=514,Oc=515,rh=516,ah=517,Bc=518,zc=519,oh=35044,dl="300 es",wn=2e3,ws=2001;function lh(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function As(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function ch(){const i=As("canvas");return i.style.display="block",i}const fl={};function pl(...i){const t="THREE."+i.shift();console.log(t,...i)}function Gc(i){const t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Nt(...i){i=Gc(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function te(...i){i=Gc(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function gr(...i){const t=i.join(" ");t in fl||(fl[t]=!0,Nt(...i))}function uh(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const hh={[ya]:ya,[Ta]:Aa,[ba]:ba,[ys]:wa,[Ea]:Ea,[Aa]:Ta,[Ra]:Ra,[wa]:ys};class Ri{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const s=n[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const We=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],$r=Math.PI/180,lo=180/Math.PI;function Ds(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(We[i&255]+We[i>>8&255]+We[i>>16&255]+We[i>>24&255]+"-"+We[t&255]+We[t>>8&255]+"-"+We[t>>16&15|64]+We[t>>24&255]+"-"+We[e&63|128]+We[e>>8&255]+"-"+We[e>>16&255]+We[e>>24&255]+We[n&255]+We[n>>8&255]+We[n>>16&255]+We[n>>24&255]).toLowerCase()}function Qt(i,t,e){return Math.max(t,Math.min(e,i))}function dh(i,t){return(i%t+t)%t}function Kr(i,t,e){return(1-e)*i+e*t}function fh(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function bo(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function ph(i,t){if(t.constructor===Float32Array)return i;const e=bo(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/e,-1)}function mh(i,t){if(t.constructor===Float32Array)return i;const e=bo(t);if(e===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*e)}const Yo=class Yo{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Yo.prototype.isVector2=!0;let Gt=Yo;class On{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],u=n[s+2],d=n[s+3],h=r[a+0],p=r[a+1],_=r[a+2],v=r[a+3];if(d!==v||l!==h||c!==p||u!==_){let m=l*h+c*p+u*_+d*v;m<0&&(h=-h,p=-p,_=-_,v=-v,m=-m);let f=1-o;if(m<.9995){const M=Math.acos(m),T=Math.sin(M);f=Math.sin(f*M)/T,o=Math.sin(o*M)/T,l=l*f+h*o,c=c*f+p*o,u=u*f+_*o,d=d*f+v*o}else{l=l*f+h*o,c=c*f+p*o,u=u*f+_*o,d=d*f+v*o;const M=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=M,c*=M,u*=M,d*=M}}t[e]=l,t[e+1]=c,t[e+2]=u,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],l=n[s+1],c=n[s+2],u=n[s+3],d=r[a],h=r[a+1],p=r[a+2],_=r[a+3];return t[e]=o*_+u*d+l*p-c*h,t[e+1]=l*_+u*h+c*d-o*p,t[e+2]=c*_+u*p+o*h-l*d,t[e+3]=u*_-o*d-l*h-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(s/2),d=o(r/2),h=l(n/2),p=l(s/2),_=l(r/2);switch(a){case"XYZ":this._x=h*u*d+c*p*_,this._y=c*p*d-h*u*_,this._z=c*u*_+h*p*d,this._w=c*u*d-h*p*_;break;case"YXZ":this._x=h*u*d+c*p*_,this._y=c*p*d-h*u*_,this._z=c*u*_-h*p*d,this._w=c*u*d+h*p*_;break;case"ZXY":this._x=h*u*d-c*p*_,this._y=c*p*d+h*u*_,this._z=c*u*_+h*p*d,this._w=c*u*d-h*p*_;break;case"ZYX":this._x=h*u*d-c*p*_,this._y=c*p*d+h*u*_,this._z=c*u*_-h*p*d,this._w=c*u*d+h*p*_;break;case"YZX":this._x=h*u*d+c*p*_,this._y=c*p*d+h*u*_,this._z=c*u*_-h*p*d,this._w=c*u*d-h*p*_;break;case"XZY":this._x=h*u*d-c*p*_,this._y=c*p*d-h*u*_,this._z=c*u*_+h*p*d,this._w=c*u*d+h*p*_;break;default:Nt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],u=e[6],d=e[10],h=n+o+d;if(h>0){const p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(u-l)*p,this._y=(r-c)*p,this._z=(a-s)*p}else if(n>o&&n>d){const p=2*Math.sqrt(1+n-o-d);this._w=(u-l)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(r+c)/p}else if(o>d){const p=2*Math.sqrt(1+o-n-d);this._w=(r-c)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(l+u)/p}else{const p=2*Math.sqrt(1+d-n-o);this._w=(a-s)/p,this._x=(r+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Qt(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,u=e._w;return this._x=n*u+a*o+s*c-r*l,this._y=s*u+a*l+r*o-n*c,this._z=r*u+a*c+n*l-s*o,this._w=a*u-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let l=1-e;if(o<.9995){const c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,e=Math.sin(e*c)/u,this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this._onChangeCallback()}else this._x=this._x*l+n*e,this._y=this._y*l+s*e,this._z=this._z*l+r*e,this._w=this._w*l+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const $o=class $o{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(ml.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(ml.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),u=2*(o*e-r*s),d=2*(r*n-a*e);return this.x=e+l*c+a*d-o*u,this.y=n+l*u+o*c-r*d,this.z=s+l*d+r*u-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this.z=Qt(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this.z=Qt(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Zr.copy(this).projectOnVector(t),this.sub(Zr)}reflect(t){return this.sub(Zr.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos(Qt(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};$o.prototype.isVector3=!0;let O=$o;const Zr=new O,ml=new On,Ko=class Ko{constructor(t,e,n,s,r,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){const u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],d=n[7],h=n[2],p=n[5],_=n[8],v=s[0],m=s[3],f=s[6],M=s[1],T=s[4],S=s[7],b=s[2],w=s[5],g=s[8];return r[0]=a*v+o*M+l*b,r[3]=a*m+o*T+l*w,r[6]=a*f+o*S+l*g,r[1]=c*v+u*M+d*b,r[4]=c*m+u*T+d*w,r[7]=c*f+u*S+d*g,r[2]=h*v+p*M+_*b,r[5]=h*m+p*T+_*w,r[8]=h*f+p*S+_*g,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return e*a*u-e*o*c-n*r*u+n*o*l+s*r*c-s*a*l}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=u*a-o*c,h=o*l-u*r,p=c*r-a*l,_=e*d+n*h+s*p;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const v=1/_;return t[0]=d*v,t[1]=(s*c-u*n)*v,t[2]=(o*n-s*a)*v,t[3]=h*v,t[4]=(u*e-s*l)*v,t[5]=(s*r-o*e)*v,t[6]=p*v,t[7]=(n*l-c*e)*v,t[8]=(a*e-n*r)*v,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return gr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Jr.makeScale(t,e)),this}rotate(t){return gr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Jr.makeRotation(-t)),this}translate(t,e){return gr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Jr.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Ko.prototype.isMatrix3=!0;let Ft=Ko;const Jr=new Ft,gl=new Ft().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),_l=new Ft().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function gh(){const i={enabled:!0,workingColorSpace:bs,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===re&&(s.r=Qn(s.r),s.g=Qn(s.g),s.b=Qn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===re&&(s.r=Ki(s.r),s.g=Ki(s.g),s.b=Ki(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===hi?Tr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[a].fromXYZ).multiply(this.spaces[r].toXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[bs]:{primaries:t,whitePoint:n,transfer:Tr,toXYZ:gl,fromXYZ:_l,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ye},outputColorSpaceConfig:{drawingBufferColorSpace:Ye}},[Ye]:{primaries:t,whitePoint:n,transfer:re,toXYZ:gl,fromXYZ:_l,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ye}}}),i}const Jt=gh();function Qn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ki(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Li;class _h{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{Li===void 0&&(Li=As("canvas")),Li.width=t.width,Li.height=t.height;const s=Li.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=Li}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=As("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Qn(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Qn(e[n]/255)*255):e[n]=Qn(e[n]);return{data:e,width:t.width,height:t.height}}else return Nt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let xh=0;class wo{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:xh++}),this.uuid=Ds(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width||0,e.height||0,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(Qr(s[a].image)):r.push(Qr(s[a]))}else r=Qr(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function Qr(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?_h.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Nt("Texture: Unable to serialize Texture."),{})}let vh=0;const jr=new O;class Ge extends Ri{constructor(t=Ge.DEFAULT_IMAGE,e=Ge.DEFAULT_MAPPING,n=Kn,s=Kn,r=Qe,a=Zn,o=Un,l=ln,c=Ge.DEFAULT_ANISOTROPY,u=hi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:vh++}),this.uuid=Ds(),this.name="",this.source=new wo(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Gt(0,0),this.repeat=new Gt(1,1),this.center=new Gt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ft,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(jr).x}get height(){return this.source.getSize(jr).y}get depth(){return this.source.getSize(jr).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.mipmapsAutoUpdate=t.mipmapsAutoUpdate,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isPMREMTexture=t.isPMREMTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){Nt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Nt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Pc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ca:t.x=t.x-Math.floor(t.x);break;case Kn:t.x=t.x<0?0:1;break;case Pa:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ca:t.y=t.y-Math.floor(t.y);break;case Kn:t.y=t.y<0?0:1;break;case Pa:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}Ge.DEFAULT_IMAGE=null;Ge.DEFAULT_MAPPING=Pc;Ge.DEFAULT_ANISOTROPY=1;const Zo=class Zo{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const l=t.elements,c=l[0],u=l[4],d=l[8],h=l[1],p=l[5],_=l[9],v=l[2],m=l[6],f=l[10];if(Math.abs(u-h)<.01&&Math.abs(d-v)<.01&&Math.abs(_-m)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+v)<.1&&Math.abs(_+m)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const T=(c+1)/2,S=(p+1)/2,b=(f+1)/2,w=(u+h)/4,g=(d+v)/4,E=(_+m)/4;return T>S&&T>b?T<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(T),s=w/n,r=g/n):S>b?S<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(S),n=w/s,r=E/s):b<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(b),n=g/r,s=E/r),this.set(n,s,r,e),this}let M=Math.sqrt((m-_)*(m-_)+(d-v)*(d-v)+(h-u)*(h-u));return Math.abs(M)<.001&&(M=1),this.x=(m-_)/M,this.y=(d-v)/M,this.z=(h-u)/M,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Qt(this.x,t.x,e.x),this.y=Qt(this.y,t.y,e.y),this.z=Qt(this.z,t.z,e.z),this.w=Qt(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=Qt(this.x,t,e),this.y=Qt(this.y,t,e),this.z=Qt(this.z,t,e),this.w=Qt(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qt(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Zo.prototype.isVector4=!0;let ge=Zo;class Mh extends Ri{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Qe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new ge(0,0,t,e),this.scissorTest=!1,this.viewport=new ge(0,0,t,e),this.textures=[];const s=n.count;for(let r=0;r<s;r++)this.textures[r]=new Ge({width:t,height:e,depth:n.depth}),this.textures[r].isRenderTargetTexture=!0,this.textures[r].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:Qe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.mipmapsAutoUpdate!==void 0&&(e.mipmapsAutoUpdate=t.mipmapsAutoUpdate),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const s=Object.assign({},t.textures[e].image);this.textures[e].source=new wo(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;else this.depthTexture=null;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Rn extends Mh{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Hc extends Ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=Kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class Sh extends Ge{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=Kn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}const Ur=class Ur{constructor(t,e,n,s,r,a,o,l,c,u,d,h,p,_,v,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,u,d,h,p,_,v,m)}set(t,e,n,s,r,a,o,l,c,u,d,h,p,_,v,m){const f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=s,f[1]=r,f[5]=a,f[9]=o,f[13]=l,f[2]=c,f[6]=u,f[10]=d,f[14]=h,f[3]=p,f[7]=_,f[11]=v,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Ur().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,n=t.elements,s=1/Di.setFromMatrixColumn(t,0).length(),r=1/Di.setFromMatrixColumn(t,1).length(),a=1/Di.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),u=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){const h=a*u,p=a*d,_=o*u,v=o*d;e[0]=l*u,e[4]=-l*d,e[8]=c,e[1]=p+_*c,e[5]=h-v*c,e[9]=-o*l,e[2]=v-h*c,e[6]=_+p*c,e[10]=a*l}else if(t.order==="YXZ"){const h=l*u,p=l*d,_=c*u,v=c*d;e[0]=h+v*o,e[4]=_*o-p,e[8]=a*c,e[1]=a*d,e[5]=a*u,e[9]=-o,e[2]=p*o-_,e[6]=v+h*o,e[10]=a*l}else if(t.order==="ZXY"){const h=l*u,p=l*d,_=c*u,v=c*d;e[0]=h-v*o,e[4]=-a*d,e[8]=_+p*o,e[1]=p+_*o,e[5]=a*u,e[9]=v-h*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){const h=a*u,p=a*d,_=o*u,v=o*d;e[0]=l*u,e[4]=_*c-p,e[8]=h*c+v,e[1]=l*d,e[5]=v*c+h,e[9]=p*c-_,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){const h=a*l,p=a*c,_=o*l,v=o*c;e[0]=l*u,e[4]=v-h*d,e[8]=_*d+p,e[1]=d,e[5]=a*u,e[9]=-o*u,e[2]=-c*u,e[6]=p*d+_,e[10]=h-v*d}else if(t.order==="XZY"){const h=a*l,p=a*c,_=o*l,v=o*c;e[0]=l*u,e[4]=-d,e[8]=c*u,e[1]=h*d+v,e[5]=a*u,e[9]=p*d-_,e[2]=_*d-p,e[6]=o*u,e[10]=v*d+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(yh,t,Eh)}lookAt(t,e,n){const s=this.elements;return rn.subVectors(t,e),rn.lengthSq()===0&&(rn.z=1),rn.normalize(),ii.crossVectors(n,rn),ii.lengthSq()===0&&(Math.abs(n.z)===1?rn.x+=1e-4:rn.z+=1e-4,rn.normalize(),ii.crossVectors(n,rn)),ii.normalize(),Bs.crossVectors(rn,ii),s[0]=ii.x,s[4]=Bs.x,s[8]=rn.x,s[1]=ii.y,s[5]=Bs.y,s[9]=rn.y,s[2]=ii.z,s[6]=Bs.z,s[10]=rn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],d=n[5],h=n[9],p=n[13],_=n[2],v=n[6],m=n[10],f=n[14],M=n[3],T=n[7],S=n[11],b=n[15],w=s[0],g=s[4],E=s[8],I=s[12],R=s[1],L=s[5],D=s[9],B=s[13],C=s[2],z=s[6],V=s[10],F=s[14],tt=s[3],W=s[7],J=s[11],j=s[15];return r[0]=a*w+o*R+l*C+c*tt,r[4]=a*g+o*L+l*z+c*W,r[8]=a*E+o*D+l*V+c*J,r[12]=a*I+o*B+l*F+c*j,r[1]=u*w+d*R+h*C+p*tt,r[5]=u*g+d*L+h*z+p*W,r[9]=u*E+d*D+h*V+p*J,r[13]=u*I+d*B+h*F+p*j,r[2]=_*w+v*R+m*C+f*tt,r[6]=_*g+v*L+m*z+f*W,r[10]=_*E+v*D+m*V+f*J,r[14]=_*I+v*B+m*F+f*j,r[3]=M*w+T*R+S*C+b*tt,r[7]=M*g+T*L+S*z+b*W,r[11]=M*E+T*D+S*V+b*J,r[15]=M*I+T*B+S*F+b*j,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],u=t[2],d=t[6],h=t[10],p=t[14],_=t[3],v=t[7],m=t[11],f=t[15],M=l*p-c*h,T=o*p-c*d,S=o*h-l*d,b=a*p-c*u,w=a*h-l*u,g=a*d-o*u;return e*(v*M-m*T+f*S)-n*(_*M-m*b+f*w)+s*(_*T-v*b+f*g)-r*(_*S-v*w+m*g)}determinantAffine(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],l=t[2],c=t[6],u=t[10];return e*(a*u-o*c)-n*(r*u-o*l)+s*(r*c-a*l)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=t[9],h=t[10],p=t[11],_=t[12],v=t[13],m=t[14],f=t[15],M=e*o-n*a,T=e*l-s*a,S=e*c-r*a,b=n*l-s*o,w=n*c-r*o,g=s*c-r*l,E=u*v-d*_,I=u*m-h*_,R=u*f-p*_,L=d*m-h*v,D=d*f-p*v,B=h*f-p*m,C=M*B-T*D+S*L+b*R-w*I+g*E;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const z=1/C;return t[0]=(o*B-l*D+c*L)*z,t[1]=(s*D-n*B-r*L)*z,t[2]=(v*g-m*w+f*b)*z,t[3]=(h*w-d*g-p*b)*z,t[4]=(l*R-a*B-c*I)*z,t[5]=(e*B-s*R+r*I)*z,t[6]=(m*S-_*g-f*T)*z,t[7]=(u*g-h*S+p*T)*z,t[8]=(a*D-o*R+c*E)*z,t[9]=(n*R-e*D-r*E)*z,t[10]=(_*w-v*S+f*M)*z,t[11]=(d*S-u*w-p*M)*z,t[12]=(o*I-a*L-l*E)*z,t[13]=(e*L-n*I+s*E)*z,t[14]=(v*T-_*b-m*M)*z,t[15]=(u*b-d*T+h*M)*z,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,u=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+n,u*l-s*a,0,c*l-s*o,u*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,u=a+a,d=o+o,h=r*c,p=r*u,_=r*d,v=a*u,m=a*d,f=o*d,M=l*c,T=l*u,S=l*d,b=n.x,w=n.y,g=n.z;return s[0]=(1-(v+f))*b,s[1]=(p+S)*b,s[2]=(_-T)*b,s[3]=0,s[4]=(p-S)*w,s[5]=(1-(h+f))*w,s[6]=(m+M)*w,s[7]=0,s[8]=(_+T)*g,s[9]=(m-M)*g,s[10]=(1-(h+v))*g,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];const r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=Di.set(s[0],s[1],s[2]).length();const o=Di.set(s[4],s[5],s[6]).length(),l=Di.set(s[8],s[9],s[10]).length();r<0&&(a=-a),Mn.copy(this);const c=1/a,u=1/o,d=1/l;return Mn.elements[0]*=c,Mn.elements[1]*=c,Mn.elements[2]*=c,Mn.elements[4]*=u,Mn.elements[5]*=u,Mn.elements[6]*=u,Mn.elements[8]*=d,Mn.elements[9]*=d,Mn.elements[10]*=d,e.setFromRotationMatrix(Mn),n.x=a,n.y=o,n.z=l,this}makePerspective(t,e,n,s,r,a,o=wn,l=!1){const c=this.elements,u=2*r/(e-t),d=2*r/(n-s),h=(e+t)/(e-t),p=(n+s)/(n-s);let _,v;if(l)_=r/(a-r),v=a*r/(a-r);else if(o===wn)_=-(a+r)/(a-r),v=-2*a*r/(a-r);else if(o===ws)_=-a/(a-r),v=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=d,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=_,c[14]=v,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=wn,l=!1){const c=this.elements,u=2/(e-t),d=2/(n-s),h=-(e+t)/(e-t),p=-(n+s)/(n-s);let _,v;if(l)_=1/(a-r),v=a/(a-r);else if(o===wn)_=-2/(a-r),v=-(a+r)/(a-r);else if(o===ws)_=-1/(a-r),v=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=d,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=_,c[14]=v,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Ur.prototype.isMatrix4=!0;let ne=Ur;const Di=new O,Mn=new ne,yh=new O(0,0,0),Eh=new O(1,1,1),ii=new O,Bs=new O,rn=new O,xl=new ne,vl=new On;class _i{constructor(t=0,e=0,n=0,s=_i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],u=s[9],d=s[2],h=s[6],p=s[10];switch(e){case"XYZ":this._y=Math.asin(Qt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Qt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(Qt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Qt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Qt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Qt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,p),this._y=0);break;default:Nt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return xl.makeRotationFromQuaternion(t),this.setFromRotationMatrix(xl,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return vl.setFromEuler(this),this.setFromQuaternion(vl,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}_i.DEFAULT_ORDER="XYZ";class Ao{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let Th=0;const Ml=new O,Ii=new On,Vn=new ne,zs=new O,ls=new O,bh=new O,wh=new On,Sl=new O(1,0,0),yl=new O(0,1,0),El=new O(0,0,1),Tl={type:"added"},Ah={type:"removed"},Ni={type:"childadded",child:null},ta={type:"childremoved",child:null};class Fe extends Ri{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Th++}),this.uuid=Ds(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Fe.DEFAULT_UP.clone();const t=new O,e=new _i,n=new On,s=new O(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ne},normalMatrix:{value:new Ft}}),this.matrix=new ne,this.matrixWorld=new ne,this.matrixAutoUpdate=Fe.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ao,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return Ii.setFromAxisAngle(t,e),this.quaternion.multiply(Ii),this}rotateOnWorldAxis(t,e){return Ii.setFromAxisAngle(t,e),this.quaternion.premultiply(Ii),this}rotateX(t){return this.rotateOnAxis(Sl,t)}rotateY(t){return this.rotateOnAxis(yl,t)}rotateZ(t){return this.rotateOnAxis(El,t)}translateOnAxis(t,e){return Ml.copy(t).applyQuaternion(this.quaternion),this.position.add(Ml.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Sl,t)}translateY(t){return this.translateOnAxis(yl,t)}translateZ(t){return this.translateOnAxis(El,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Vn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?zs.copy(t):zs.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),ls.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Vn.lookAt(ls,zs,this.up):Vn.lookAt(zs,ls,this.up),this.quaternion.setFromRotationMatrix(Vn),s&&(Vn.extractRotation(s.matrixWorld),Ii.setFromRotationMatrix(Vn),this.quaternion.premultiply(Ii.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(te("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(Tl),Ni.child=t,this.dispatchEvent(Ni),Ni.child=null):te("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Ah),ta.child=t,this.dispatchEvent(ta),ta.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Vn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Vn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Vn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(Tl),Ni.child=t,this.dispatchEvent(Ni),Ni.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ls,t,bh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ls,wh,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){const s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const d=l[c];r(t.shapes,d)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){const o=a(t.geometries),l=a(t.materials),c=a(t.textures),u=a(t.images),d=a(t.shapes),h=a(t.skeletons),p=a(t.animations),_=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),d.length>0&&(n.shapes=d),h.length>0&&(n.skeletons=h),p.length>0&&(n.animations=p),_.length>0&&(n.nodes=_)}return n.object=s,n;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Fe.DEFAULT_UP=new O(0,1,0);Fe.DEFAULT_MATRIX_AUTO_UPDATE=!0;Fe.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class cn extends Fe{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Rh={type:"move"};class ea{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new cn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new cn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new cn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(const v of t.hand.values()){const m=e.getJointPose(v,n),f=this._getHandJoint(c,v);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.quaternion,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}const u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),p=.02,_=.005;c.inputState.pinching&&h>p+_?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=p-_&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.quaternion,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Rh)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new cn;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const kc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},si={h:0,s:0,l:0},Gs={h:0,s:0,l:0};function na(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class Dt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ye){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,Jt.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=Jt.workingColorSpace){return this.r=t,this.g=e,this.b=n,Jt.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=Jt.workingColorSpace){if(t=dh(t,1),e=Qt(e,0,1),n=Qt(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=na(a,r,t+1/3),this.g=na(a,r,t),this.b=na(a,r,t-1/3)}return Jt.colorSpaceToWorking(this,s),this}setStyle(t,e=Ye){function n(r){r!==void 0&&parseFloat(r)<1&&Nt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseFloat(r[1]))/100,Math.min(100,parseFloat(r[2]))/100,Math.min(100,parseFloat(r[3]))/100,e);break;case"hsl":case"hsla":if(r=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Nt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Nt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ye){const n=kc[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Nt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Qn(t.r),this.g=Qn(t.g),this.b=Qn(t.b),this}copyLinearToSRGB(t){return this.r=Ki(t.r),this.g=Ki(t.g),this.b=Ki(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ye){return Jt.workingToColorSpace(Xe.copy(this),t),Math.round(Qt(Xe.r*255,0,255))*65536+Math.round(Qt(Xe.g*255,0,255))*256+Math.round(Qt(Xe.b*255,0,255))}getHexString(t=Ye){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=Jt.workingColorSpace){Jt.workingToColorSpace(Xe.copy(this),e);const n=Xe.r,s=Xe.g,r=Xe.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const d=a-o;switch(c=u<=.5?d/(a+o):d/(2-a-o),a){case n:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-n)/d+2;break;case r:l=(n-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,e=Jt.workingColorSpace){return Jt.workingToColorSpace(Xe.copy(this),e),t.r=Xe.r,t.g=Xe.g,t.b=Xe.b,t}getStyle(t=Ye){Jt.workingToColorSpace(Xe.copy(this),t);const e=Xe.r,n=Xe.g,s=Xe.b;return t!==Ye?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(si),this.setHSL(si.h+t,si.s+e,si.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(si),t.getHSL(Gs);const n=Kr(si.h,Gs.h,e),s=Kr(si.s,Gs.s,e),r=Kr(si.l,Gs.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Xe=new Dt;Dt.NAMES=kc;class Ro{constructor(t,e=1,n=1e3){this.isFog=!0,this.name="",this.color=new Dt(t),this.near=e,this.far=n}clone(){return new Ro(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}}class Vc extends Fe{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new _i,this.environmentIntensity=1,this.environmentRotation=new _i,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),this.background=t.background!==null?t.background.clone():null,this.environment=t.environment!==null?t.environment.clone():null,this.fog=t.fog!==null?t.fog.clone():null,this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),this.overrideMaterial=t.overrideMaterial!==null?t.overrideMaterial.clone():null,this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}}const Sn=new O,Wn=new O,ia=new O,Xn=new O,Ui=new O,Fi=new O,bl=new O,sa=new O,ra=new O,aa=new O,oa=new ge,la=new ge,ca=new ge;class Tn{constructor(t=new O,e=new O,n=new O){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Sn.subVectors(t,e),s.cross(Sn);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Sn.subVectors(s,e),Wn.subVectors(n,e),ia.subVectors(t,e);const a=Sn.dot(Sn),o=Sn.dot(Wn),l=Sn.dot(ia),c=Wn.dot(Wn),u=Wn.dot(ia),d=a*c-o*o;if(d===0)return r.set(0,0,0),null;const h=1/d,p=(c*l-o*u)*h,_=(a*u-o*l)*h;return r.set(1-p-_,_,p)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,Xn)===null?!1:Xn.x>=0&&Xn.y>=0&&Xn.x+Xn.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,Xn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Xn.x),l.addScaledVector(a,Xn.y),l.addScaledVector(o,Xn.z),l)}static getInterpolatedAttribute(t,e,n,s,r,a){return oa.setScalar(0),la.setScalar(0),ca.setScalar(0),oa.fromBufferAttribute(t,e),la.fromBufferAttribute(t,n),ca.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(oa,r.x),a.addScaledVector(la,r.y),a.addScaledVector(ca,r.z),a}static isFrontFacing(t,e,n,s){return Sn.subVectors(n,e),Wn.subVectors(t,e),Sn.cross(Wn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Sn.subVectors(this.c,this.b),Wn.subVectors(this.a,this.b),Sn.cross(Wn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Tn.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Tn.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return Tn.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return Tn.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Tn.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;Ui.subVectors(s,n),Fi.subVectors(r,n),sa.subVectors(t,n);const l=Ui.dot(sa),c=Fi.dot(sa);if(l<=0&&c<=0)return e.copy(n);ra.subVectors(t,s);const u=Ui.dot(ra),d=Fi.dot(ra);if(u>=0&&d<=u)return e.copy(s);const h=l*d-u*c;if(h<=0&&l>=0&&u<=0&&l-u>0)return a=l/(l-u),e.copy(n).addScaledVector(Ui,a);aa.subVectors(t,r);const p=Ui.dot(aa),_=Fi.dot(aa);if(_>=0&&p<=_)return e.copy(r);const v=p*c-l*_;if(v<=0&&c>=0&&_<=0)return o=c/(c-_),e.copy(n).addScaledVector(Fi,o);const m=u*_-p*d;if(m<=0&&d-u>=0&&p-_>=0)return bl.subVectors(r,s),o=(d-u)/(d-u+(p-_)),e.copy(s).addScaledVector(bl,o);const f=1/(m+v+h);return a=v*f,o=h*f,e.copy(n).addScaledVector(Ui,a).addScaledVector(Fi,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Ci{constructor(t=new O(1/0,1/0,1/0),e=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(yn.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(yn.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=yn.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0&&t.isBatchedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,yn):yn.fromBufferAttribute(r,a),yn.applyMatrix4(t.matrixWorld),this.expandByPoint(yn);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Hs.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Hs.copy(n.boundingBox)),Hs.applyMatrix4(t.matrixWorld),this.union(Hs)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,yn),yn.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(cs),ks.subVectors(this.max,cs),Oi.subVectors(t.a,cs),Bi.subVectors(t.b,cs),zi.subVectors(t.c,cs),ri.subVectors(Bi,Oi),ai.subVectors(zi,Bi),Si.subVectors(Oi,zi);let e=[0,-ri.z,ri.y,0,-ai.z,ai.y,0,-Si.z,Si.y,ri.z,0,-ri.x,ai.z,0,-ai.x,Si.z,0,-Si.x,-ri.y,ri.x,0,-ai.y,ai.x,0,-Si.y,Si.x,0];return!ua(e,Oi,Bi,zi,ks)||(e=[1,0,0,0,1,0,0,0,1],!ua(e,Oi,Bi,zi,ks))?!1:(Vs.crossVectors(ri,ai),e=[Vs.x,Vs.y,Vs.z],ua(e,Oi,Bi,zi,ks))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,yn).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(yn).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(qn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),qn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),qn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),qn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),qn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),qn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),qn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),qn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(qn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const qn=[new O,new O,new O,new O,new O,new O,new O,new O],yn=new O,Hs=new Ci,Oi=new O,Bi=new O,zi=new O,ri=new O,ai=new O,Si=new O,cs=new O,ks=new O,Vs=new O,yi=new O;function ua(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){yi.fromArray(i,r);const o=s.x*Math.abs(yi.x)+s.y*Math.abs(yi.y)+s.z*Math.abs(yi.z),l=t.dot(yi),c=e.dot(yi),u=n.dot(yi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const Se=new O,Ws=new Gt;let Ch=0;class Ue extends Ri{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Ch++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=oh,this.updateRanges=[],this.gpuType=bn,this.version=0,this._normalizationScale=t!==void 0?bo(t):void 0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this._normalizationScale=t._normalizationScale,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Ws.fromBufferAttribute(this,e),Ws.applyMatrix3(t),this.setXY(e,Ws.x,Ws.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix3(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyMatrix4(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.applyNormalMatrix(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Se.fromBufferAttribute(this,e),Se.transformDirection(t),this.setXYZ(e,Se.x,Se.y,Se.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=this._denormalize(n)),n}setComponent(t,e,n){return this.normalized&&(n=this._normalize(n)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=this._denormalize(e)),e}setX(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=this._denormalize(e)),e}setY(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=this._denormalize(e)),e}setZ(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=this._denormalize(e)),e}setW(t,e){return this.normalized&&(e=this._normalize(e)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=this._normalize(e),n=this._normalize(n),s=this._normalize(s),r=this._normalize(r)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(t){const e=this._normalizationScale;return e!==void 0?Math.max(t/e,-1):ph(t,this.array)}_normalize(t){const e=this._normalizationScale;return e!==void 0?Math.round(t*e):mh(t,this.array)}}class Wc extends Ue{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Xc extends Ue{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Oe extends Ue{constructor(t,e,n){super(new Float32Array(t),e,n)}}const Ph=new Ci,us=new O,ha=new O;class is{constructor(t=new O,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):Ph.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;us.subVectors(t,this.center);const e=us.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(us,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(ha.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(us.copy(t.center).add(ha)),this.expandByPoint(us.copy(t.center).sub(ha))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let Lh=0;const mn=new ne,da=new Fe,Gi=new O,an=new Ci,hs=new Ci,Le=new O;class tn extends Ri{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Lh++}),this.uuid=Ds(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(lh(t)?Xc:Wc)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Ft().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return mn.makeRotationFromQuaternion(t),this.applyMatrix4(mn),this}rotateX(t){return mn.makeRotationX(t),this.applyMatrix4(mn),this}rotateY(t){return mn.makeRotationY(t),this.applyMatrix4(mn),this}rotateZ(t){return mn.makeRotationZ(t),this.applyMatrix4(mn),this}translate(t,e,n){return mn.makeTranslation(t,e,n),this.applyMatrix4(mn),this}scale(t,e,n){return mn.makeScale(t,e,n),this.applyMatrix4(mn),this}lookAt(t){return da.lookAt(t),da.updateMatrix(),this.applyMatrix4(da.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Gi).negate(),this.translate(Gi.x,Gi.y,Gi.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Oe(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Nt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ci);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){te("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];an.setFromBufferAttribute(r),this.morphTargetsRelative?(Le.addVectors(this.boundingBox.min,an.min),this.boundingBox.expandByPoint(Le),Le.addVectors(this.boundingBox.max,an.max),this.boundingBox.expandByPoint(Le)):(this.boundingBox.expandByPoint(an.min),this.boundingBox.expandByPoint(an.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&te('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new is);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){te("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(t){const n=this.boundingSphere.center;if(an.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];hs.setFromBufferAttribute(o),this.morphTargetsRelative?(Le.addVectors(an.min,hs.min),an.expandByPoint(Le),Le.addVectors(an.max,hs.max),an.expandByPoint(Le)):(an.expandByPoint(hs.min),an.expandByPoint(hs.max))}an.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Le.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Le));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)Le.fromBufferAttribute(o,c),l&&(Gi.fromBufferAttribute(t,c),Le.add(Gi)),s=Math.max(s,n.distanceToSquared(Le))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&te('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){te("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Ue(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],l=[],c=new Uint8Array(n.count);for(let I=0;I<n.count;I++)o[I]=new O,l[I]=new O;const u=new O,d=new O,h=new O,p=new Gt,_=new Gt,v=new Gt,m=new O,f=new O;function M(I,R,L){c[I]=c[R]=c[L]=1,u.fromBufferAttribute(n,I),d.fromBufferAttribute(n,R),h.fromBufferAttribute(n,L),p.fromBufferAttribute(r,I),_.fromBufferAttribute(r,R),v.fromBufferAttribute(r,L),d.sub(u),h.sub(u),_.sub(p),v.sub(p);const D=1/(_.x*v.y-v.x*_.y);isFinite(D)&&(m.copy(d).multiplyScalar(v.y).addScaledVector(h,-_.y).multiplyScalar(D),f.copy(h).multiplyScalar(_.x).addScaledVector(d,-v.x).multiplyScalar(D),o[I].add(m),o[R].add(m),o[L].add(m),l[I].add(f),l[R].add(f),l[L].add(f))}let T=this.groups;T.length===0&&(T=[{start:0,count:t.count}]);for(let I=0,R=T.length;I<R;++I){const L=T[I],D=L.start,B=L.count;for(let C=D,z=D+B;C<z;C+=3)M(t.getX(C+0),t.getX(C+1),t.getX(C+2))}const S=new O,b=new O,w=new O,g=new O;function E(I){w.fromBufferAttribute(s,I),g.copy(w);const R=o[I];S.copy(R),S.sub(w.multiplyScalar(w.dot(R))).normalize(),b.crossVectors(g,R);const D=b.dot(l[I])<0?-1:1;a.setXYZW(I,S.x,S.y,S.z,D)}for(let I=0,R=n.count;I<R;++I)c[I]&&E(I);this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new Ue(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,p=n.count;h<p;h++)n.setXYZ(h,0,0,0);const s=new O,r=new O,a=new O,o=new O,l=new O,c=new O,u=new O,d=new O;if(t)for(let h=0,p=t.count;h<p;h+=3){const _=t.getX(h+0),v=t.getX(h+1),m=t.getX(h+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,v),a.fromBufferAttribute(e,m),u.subVectors(a,r),d.subVectors(s,r),u.cross(d),o.fromBufferAttribute(n,_),l.fromBufferAttribute(n,v),c.fromBufferAttribute(n,m),o.add(u),l.add(u),c.add(u),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(v,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,p=e.count;h<p;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,r),d.subVectors(s,r),u.cross(d),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Le.fromBufferAttribute(t,e),Le.normalize(),t.setXYZ(e,Le.x,Le.y,Le.z)}toNonIndexed(){function t(o,l){const c=o.array,u=o.itemSize,d=o.normalized,h=new c.constructor(l.length*u);let p=0,_=0;for(let v=0,m=l.length;v<m;v++){o.isInterleavedBufferAttribute?p=l[v]*o.data.stride+o.offset:p=l[v]*u;for(let f=0;f<u;f++)h[_++]=c[p++]}return new Ue(h,u,d)}if(this.index===null)return Nt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new tn,n=this.index.array,s=this.attributes;for(const o in s){const l=s[o],c=t(l,n);e.setAttribute(o,c)}const r=this.morphAttributes;for(const o in r){const l=[],c=r[o];for(let u=0,d=c.length;u<d;u++){const h=c[u],p=t(h,n);l.push(p)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const l in n){const c=n[l];t.data.attributes[l]=c.toJSON(t.data)}const s={};let r=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let d=0,h=c.length;d<h;d++){const p=c[d];u.push(p.toJSON(t.data))}u.length>0&&(s[l]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const s=t.attributes;for(const c in s){const u=s[c];this.setAttribute(c,u.clone(e))}const r=t.morphAttributes;for(const c in r){const u=[],d=r[c];for(let h=0,p=d.length;h<p;h++)u.push(d[h].clone(e));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let c=0,u=a.length;c<u;c++){const d=a[c];this.addGroup(d.start,d.count,d.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const fa=new O,Dh=new O,Ih=new Ft;class ci{constructor(t=new O(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=fa.subVectors(n,e).cross(Dh.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){const s=t.delta(fa),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||Ih.getNormalMatrix(t),s=this.coplanarPoint(fa).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let Nh=0;class ss extends Ri{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Nh++}),this.uuid=Ds(),this.name="",this.type="Material",this.blending=xs,this.side=ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Sc,this.blendDst=yc,this.blendEquation=qi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Dt(0,0,0),this.blendAlpha=0,this.depthFunc=ys,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=eh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Yr,this.stencilZFail=Yr,this.stencilZPass=Yr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){Nt(`Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Nt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(t).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const l=r[o];delete l.metadata,a.push(l)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Dt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.diffuseRoughness!==void 0&&(this.diffuseRoughness=t.diffuseRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessMinimum),t.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=t.iridescenceThicknessMaximum),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=t.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=t.iridescenceThicknessRange[1]),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new ci().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Gt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Gt().fromArray(t.clearcoatNormalScale)),t.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=e[t.diffuseRoughnessMap]||null),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const Yn=new O,pa=new O,Xs=new O,qs=new O;class Co{constructor(t=new O,e=new O(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Yn)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=Yn.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Yn.copy(this.origin).addScaledVector(this.direction,e),Yn.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){pa.copy(t).add(e).multiplyScalar(.5),Xs.copy(e).sub(t).normalize(),qs.copy(this.origin).sub(pa);const r=t.distanceTo(e)*.5,a=-this.direction.dot(Xs),o=qs.dot(this.direction),l=-qs.dot(Xs),c=qs.lengthSq(),u=Math.abs(1-a*a);let d,h,p,_;if(u>0)if(d=a*l-o,h=a*o-l,_=r*u,d>=0)if(h>=-_)if(h<=_){const v=1/u;d*=v,h*=v,p=d*(d+a*h+2*o)+h*(a*d+h+2*l)+c}else h=r,d=Math.max(0,-(a*h+o)),p=-d*d+h*(h+2*l)+c;else h=-r,d=Math.max(0,-(a*h+o)),p=-d*d+h*(h+2*l)+c;else h<=-_?(d=Math.max(0,-(-a*r+o)),h=d>0?-r:Math.min(Math.max(-r,-l),r),p=-d*d+h*(h+2*l)+c):h<=_?(d=0,h=Math.min(Math.max(-r,-l),r),p=h*(h+2*l)+c):(d=Math.max(0,-(a*r+o)),h=d>0?r:Math.min(Math.max(-r,-l),r),p=-d*d+h*(h+2*l)+c);else h=a>0?-r:r,d=Math.max(0,-(a*h+o)),p=-d*d+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(pa).addScaledVector(Xs,h),p}intersectSphere(t,e){if(t.radius<0)return null;Yn.subVectors(t.center,this.origin);const n=Yn.dot(this.direction),s=Yn.dot(Yn)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(n=(t.min.x-h.x)*c,s=(t.max.x-h.x)*c):(n=(t.max.x-h.x)*c,s=(t.min.x-h.x)*c),u>=0?(r=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),d>=0?(o=(t.min.z-h.z)*d,l=(t.max.z-h.z)*d):(o=(t.max.z-h.z)*d,l=(t.min.z-h.z)*d),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Yn)!==null}intersectTriangle(t,e,n,s,r){const a=this.origin,o=this.direction,l=o.x,c=o.y,u=o.z,d=t.x-a.x,h=t.y-a.y,p=t.z-a.z,_=e.x-a.x,v=e.y-a.y,m=e.z-a.z,f=n.x-a.x,M=n.y-a.y,T=n.z-a.z,S=Math.abs(l),b=Math.abs(c),w=Math.abs(u);let g,E,I,R,L,D,B,C,z,V,F,tt;if(S>=b&&S>=w?(I=l,D=d,z=_,tt=f,l>=0?(g=c,E=u,R=h,L=p,B=v,C=m,V=M,F=T):(g=u,E=c,R=p,L=h,B=m,C=v,V=T,F=M)):b>=w?(I=c,D=h,z=v,tt=M,c>=0?(g=u,E=l,R=p,L=d,B=m,C=_,V=T,F=f):(g=l,E=u,R=d,L=p,B=_,C=m,V=f,F=T)):(I=u,D=p,z=m,tt=T,u>=0?(g=l,E=c,R=d,L=h,B=_,C=v,V=f,F=M):(g=c,E=l,R=h,L=d,B=v,C=_,V=M,F=f)),I===0)return null;const W=g/I,J=E/I,j=1/I,ut=R-W*D,Rt=L-J*D,q=B-W*z,pt=C-J*z,St=V-W*tt,Ct=F-J*tt,ft=St*pt-Ct*q,zt=ut*Ct-Rt*St,ve=q*Rt-pt*ut;if(s){if(ft<0||zt<0||ve<0)return null}else if((ft<0||zt<0||ve<0)&&(ft>0||zt>0||ve>0))return null;const It=ft+zt+ve;if(It===0)return null;const ie=j*(ft*D+zt*z+ve*tt);return(It>0?ie<0:ie>0)?null:this.at(ie/It,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class sn extends ss{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Dt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new _i,this.combine=_o,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const wl=new ne,Ei=new Co,Ys=new is,Al=new O,$s=new O,Ks=new O,Zs=new O,ma=new O,Js=new O,Rl=new O,Qs=new O;class Xt extends Fe{constructor(t=new tn,e=new sn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){Js.set(0,0,0);for(let l=0,c=r.length;l<c;l++){const u=o[l],d=r[l];u!==0&&(ma.fromBufferAttribute(d,t),a?Js.addScaledVector(ma,u):Js.addScaledVector(ma.sub(e),u))}e.add(Js)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ys.copy(n.boundingSphere),Ys.applyMatrix4(r),Ei.copy(t.ray).recast(t.near),!(Ys.containsPoint(Ei.origin)===!1&&(Ei.intersectSphere(Ys,Al)===null||Ei.origin.distanceToSquared(Al)>(t.far-t.near)**2))&&(wl.copy(r).invert(),Ei.copy(t.ray).applyMatrix4(wl),!(n.boundingBox!==null&&Ei.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Ei)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,u=r.attributes.uv1,d=r.attributes.normal,h=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,v=h.length;_<v;_++){const m=h[_],f=a[m.materialIndex],M=Math.max(m.start,p.start),T=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let S=M,b=T;S<b;S+=3){const w=o.getX(S),g=o.getX(S+1),E=o.getX(S+2);s=js(this,f,t,n,c,u,d,w,g,E),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const _=Math.max(0,p.start),v=Math.min(o.count,p.start+p.count);for(let m=_,f=v;m<f;m+=3){const M=o.getX(m),T=o.getX(m+1),S=o.getX(m+2);s=js(this,a,t,n,c,u,d,M,T,S),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let _=0,v=h.length;_<v;_++){const m=h[_],f=a[m.materialIndex],M=Math.max(m.start,p.start),T=Math.min(l.count,Math.min(m.start+m.count,p.start+p.count));for(let S=M,b=T;S<b;S+=3){const w=S,g=S+1,E=S+2;s=js(this,f,t,n,c,u,d,w,g,E),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const _=Math.max(0,p.start),v=Math.min(l.count,p.start+p.count);for(let m=_,f=v;m<f;m+=3){const M=m,T=m+1,S=m+2;s=js(this,a,t,n,c,u,d,M,T,S),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function Uh(i,t,e,n,s,r,a,o){let l;if(t.side===je?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===ti,o),l===null)return null;Qs.copy(o),Qs.applyMatrix4(i.matrixWorld);const c=e.ray.origin.distanceTo(Qs);return c<e.near||c>e.far?null:{distance:c,point:Qs.clone(),object:i}}function js(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,$s),i.getVertexPosition(l,Ks),i.getVertexPosition(c,Zs);const u=Uh(i,t,e,n,$s,Ks,Zs,Rl);if(u){const d=new O;Tn.getBarycoord(Rl,$s,Ks,Zs,d),s&&(u.uv=Tn.getInterpolatedAttribute(s,o,l,c,d,new Gt)),r&&(u.uv1=Tn.getInterpolatedAttribute(r,o,l,c,d,new Gt)),a&&(u.normal=Tn.getInterpolatedAttribute(a,o,l,c,d,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new O,materialIndex:0};Tn.getNormal($s,Ks,Zs,h.normal),u.face=h,u.barycoord=d}return u}class qc extends Ge{constructor(t=null,e=1,n=1,s,r,a,o,l,c=ye,u=ye,d,h){super(null,a,o,l,c,u,s,r,d,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Cl extends Ue{constructor(t,e,n,s=1){super(t,e,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(t){return super.copy(t),this.meshPerAttribute=t.meshPerAttribute,this}toJSON(){const t=super.toJSON();return t.meshPerAttribute=this.meshPerAttribute,t.isInstancedBufferAttribute=!0,t}}const Hi=new ne,Pl=new ne,tr=[],Ll=new Ci,Fh=new ne,ds=new Xt,fs=new is;class _r extends Xt{constructor(t,e,n){super(t,e),this.isInstancedMesh=!0,this.instanceMatrix=new Cl(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Fh)}computeBoundingBox(){const t=this.geometry,e=this.count;this.boundingBox===null&&(this.boundingBox=new Ci),t.boundingBox===null&&t.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Hi),Ll.copy(t.boundingBox).applyMatrix4(Hi),this.boundingBox.union(Ll)}computeBoundingSphere(){const t=this.geometry,e=this.count;this.boundingSphere===null&&(this.boundingSphere=new is),t.boundingSphere===null&&t.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<e;n++)this.getMatrixAt(n,Hi),fs.copy(t.boundingSphere).applyMatrix4(Hi),this.boundingSphere.union(fs)}copy(t,e){return super.copy(t,e),this.instanceMatrix.copy(t.instanceMatrix),this.morphTexture=t.morphTexture!==null?t.morphTexture.clone():null,this.instanceColor=t.instanceColor!==null?t.instanceColor.clone():null,this.count=t.count,this.boundingBox=t.boundingBox!==null?t.boundingBox.clone():null,this.boundingSphere=t.boundingSphere!==null?t.boundingSphere.clone():null,this}getColorAt(t,e){return this.instanceColor===null?e.setRGB(1,1,1):e.fromArray(this.instanceColor.array,t*3)}getMatrixAt(t,e){return e.fromArray(this.instanceMatrix.array,t*16)}getMorphAt(t,e){const n=e.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,a=t*r+1;for(let o=0;o<n.length;o++)n[o]=s[a+o]}raycast(t,e){const n=this.matrixWorld,s=this.count;if(ds.geometry=this.geometry,ds.material=this.material,ds.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fs.copy(this.boundingSphere),fs.applyMatrix4(n),t.ray.intersectsSphere(fs)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Hi),Pl.multiplyMatrices(n,Hi),ds.matrixWorld=Pl,ds.raycast(t,tr);for(let a=0,o=tr.length;a<o;a++){const l=tr[a];l.instanceId=r,l.object=this,e.push(l)}tr.length=0}}setColorAt(t,e){return this.instanceColor===null&&(this.instanceColor=new Cl(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),e.toArray(this.instanceColor.array,t*3),this}setMatrixAt(t,e){return e.toArray(this.instanceMatrix.array,t*16),this}setMorphAt(t,e){const n=e.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new qc(new Float32Array(s*this.count),s,this.count,So,bn));const r=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=s*t;return r[l]=o,r.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const Ti=new is,Oh=new Gt(.5,.5),er=new O;class Rs{constructor(t=new ci,e=new ci,n=new ci,s=new ci,r=new ci,a=new ci){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=wn,n=!1){const s=this.planes,r=t.elements,a=r[0],o=r[1],l=r[2],c=r[3],u=r[4],d=r[5],h=r[6],p=r[7],_=r[8],v=r[9],m=r[10],f=r[11],M=r[12],T=r[13],S=r[14],b=r[15];if(s[0].setComponents(c-a,p-u,f-_,b-M).normalize(),s[1].setComponents(c+a,p+u,f+_,b+M).normalize(),s[2].setComponents(c+o,p+d,f+v,b+T).normalize(),s[3].setComponents(c-o,p-d,f-v,b-T).normalize(),n)s[4].setComponents(l,h,m,S).normalize(),s[5].setComponents(c-l,p-h,f-m,b-S).normalize();else if(s[4].setComponents(c-l,p-h,f-m,b-S).normalize(),e===wn)s[5].setComponents(c+l,p+h,f+m,b+S).normalize();else if(e===ws)s[5].setComponents(l,h,m,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Ti.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Ti.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Ti)}intersectsSprite(t){Ti.center.set(0,0,0);const e=Oh.distanceTo(t.center);return Ti.radius=.7071067811865476+e,Ti.applyMatrix4(t.matrixWorld),this.intersectsSphere(Ti)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(er.x=s.normal.x>0?t.max.x:t.min.x,er.y=s.normal.y>0?t.max.y:t.min.y,er.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(er)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}const Dl=new ne;class Po{constructor(){this.coordinateSystem=wn,this._frustums=[],this._count=0}setFromArrayCamera(t){const e=t.cameras,n=this._frustums;for(let s=0;s<e.length;s++){const r=e[s];Dl.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[s]===void 0&&(n[s]=new Rs),n[s].setFromProjectionMatrix(Dl,r.coordinateSystem,r.reversedDepth)}return this._count=e.length,this}getFrustum(t){return this._frustums[t]}intersectsObject(t){const e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsObject(t))return!0;return!1}intersectsSprite(t){const e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSprite(t))return!0;return!1}intersectsSphere(t){const e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsSphere(t))return!0;return!1}intersectsBox(t){const e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].intersectsBox(t))return!0;return!1}containsPoint(t){const e=this._frustums;for(let n=0;n<this._count;n++)if(e[n].containsPoint(t))return!0;return!1}copy(t){this.coordinateSystem=t.coordinateSystem;const e=this._frustums,n=t._frustums;for(let s=0;s<t._count;s++)e[s]===void 0&&(e[s]=new Rs),e[s].copy(n[s]);return this._count=t._count,this}clone(){return new Po().copy(this)}}class Yc extends ss{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Dt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}}const Il=new ne,co=new Co,nr=new is,ir=new O;class Bh extends Fe{constructor(t=new tn,e=new Yc){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0?this.morphTargetInfluences=t.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,t.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),nr.copy(n.boundingSphere),nr.applyMatrix4(s),nr.radius+=r,t.ray.intersectsSphere(nr)===!1)return;Il.copy(s).invert(),co.copy(t.ray).applyMatrix4(Il);const o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,d=n.attributes.position;if(c!==null){const h=Math.max(0,a.start),p=Math.min(c.count,a.start+a.count);for(let _=h,v=p;_<v;_++){const m=c.getX(_);ir.fromBufferAttribute(d,m),Nl(ir,m,l,s,t,e,this)}}else{const h=Math.max(0,a.start),p=Math.min(d.count,a.start+a.count);for(let _=h,v=p;_<v;_++)ir.fromBufferAttribute(d,_),Nl(ir,_,l,s,t,e,this)}}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}}function Nl(i,t,e,n,s,r,a){const o=co.distanceSqToPoint(i);if(o<e){const l=new O;co.closestPointToPoint(i,l),l.applyMatrix4(n);const c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:a})}}class $c extends Ge{constructor(t=[],e=ji,n,s,r,a,o,l,c,u){super(t,e,n,s,r,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class Fr extends Ge{constructor(t,e,n,s,r,a,o,l,c){super(t,e,n,s,r,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class es extends Ge{constructor(t,e,n=Bn,s,r,a,o=ye,l=ye,c,u=gi,d=1){if(u!==gi&&u!==pi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:t,height:e,depth:d};super(h,s,r,a,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new wo(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}}class Kc extends es{constructor(t,e=Bn,n=ji,s,r,a=ye,o=ye,l,c=gi){const u={width:t,height:t,depth:1},d=[u,u,u,u,u,u];super(t,t,e,n,s,r,a,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Zc extends Ge{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class nn extends tn{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const l=[],c=[],u=[],d=[];let h=0,p=0;_("z","y","x",-1,-1,n,e,t,a,r,0),_("z","y","x",1,-1,n,e,-t,a,r,1),_("x","z","y",1,1,t,n,e,s,a,2),_("x","z","y",1,-1,t,n,-e,s,a,3),_("x","y","z",1,-1,t,e,n,s,r,4),_("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new Oe(c,3)),this.setAttribute("normal",new Oe(u,3)),this.setAttribute("uv",new Oe(d,2));function _(v,m,f,M,T,S,b,w,g,E,I){const R=S/g,L=b/E,D=S/2,B=b/2,C=w/2,z=g+1,V=E+1;let F=0,tt=0;const W=new O;for(let J=0;J<V;J++){const j=J*L-B;for(let ut=0;ut<z;ut++){const Rt=ut*R-D;W[v]=Rt*M,W[m]=j*T,W[f]=C,c.push(W.x,W.y,W.z),W[v]=0,W[m]=0,W[f]=w>0?1:-1,u.push(W.x,W.y,W.z),d.push(ut/g),d.push(1-J/E),F+=1}}for(let J=0;J<E;J++)for(let j=0;j<g;j++){const ut=h+j+z*J,Rt=h+j+z*(J+1),q=h+(j+1)+z*(J+1),pt=h+(j+1)+z*J;l.push(ut,Rt,pt),l.push(Rt,q,pt),tt+=6}o.addGroup(p,tt,I),p+=tt,h+=F}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new nn(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class Cn extends tn{constructor(t=1,e=1,n=1,s=32,r=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:l};const c=this;s=Math.floor(s),r=Math.floor(r);const u=[],d=[],h=[],p=[];let _=0;const v=[],m=n/2;let f=0;M(),a===!1&&(t>0&&T(!0),e>0&&T(!1)),this.setIndex(u),this.setAttribute("position",new Oe(d,3)),this.setAttribute("normal",new Oe(h,3)),this.setAttribute("uv",new Oe(p,2));function M(){const S=new O,b=new O;let w=0;const g=(e-t)/n;for(let E=0;E<=r;E++){const I=[],R=E/r,L=R*(e-t)+t;for(let D=0;D<=s;D++){const B=D/s,C=B*l+o,z=Math.sin(C),V=Math.cos(C);b.x=L*z,b.y=-R*n+m,b.z=L*V,d.push(b.x,b.y,b.z),S.set(z,g,V).normalize(),h.push(S.x,S.y,S.z),p.push(B,1-R),I.push(_++)}v.push(I)}for(let E=0;E<s;E++)for(let I=0;I<r;I++){const R=v[I][E],L=v[I+1][E],D=v[I+1][E+1],B=v[I][E+1];(t>0||I!==0)&&(u.push(R,L,B),w+=3),(e>0||I!==r-1)&&(u.push(L,D,B),w+=3)}c.addGroup(f,w,0),f+=w}function T(S){const b=_,w=new Gt,g=new O;let E=0;const I=S===!0?t:e,R=S===!0?1:-1;for(let D=1;D<=s;D++)d.push(0,m*R,0),h.push(0,R,0),p.push(.5,.5),_++;const L=_;for(let D=0;D<=s;D++){const C=D/s*l+o,z=Math.cos(C),V=Math.sin(C);g.x=I*V,g.y=m*R,g.z=I*z,d.push(g.x,g.y,g.z),h.push(0,R,0),w.x=z*.5+.5,w.y=V*.5*R+.5,p.push(w.x,w.y),_++}for(let D=0;D<s;D++){const B=b+D,C=L+D;S===!0?u.push(C,C+1,B):u.push(C+1,C,B),E+=3}c.addGroup(f,E,S===!0?1:2),f+=E}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Cn(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Or extends Cn{constructor(t=1,e=1,n=32,s=1,r=!1,a=0,o=Math.PI*2){super(0,t,e,n,s,r,a,o),this.type="ConeGeometry",this.parameters={radius:t,height:e,radialSegments:n,heightSegments:s,openEnded:r,thetaStart:a,thetaLength:o}}static fromJSON(t){return new Or(t.radius,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}}class Lo extends tn{constructor(t=[],e=[],n=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:t,indices:e,radius:n,detail:s};const r=[],a=[];o(s),c(n),u(),this.setAttribute("position",new Oe(r,3)),this.setAttribute("normal",new Oe(r.slice(),3)),this.setAttribute("uv",new Oe(a,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function o(M){const T=new O,S=new O,b=new O;for(let w=0;w<e.length;w+=3)p(e[w+0],T),p(e[w+1],S),p(e[w+2],b),l(T,S,b,M)}function l(M,T,S,b){const w=b+1,g=[];for(let E=0;E<=w;E++){g[E]=[];const I=M.clone().lerp(S,E/w),R=T.clone().lerp(S,E/w),L=w-E;for(let D=0;D<=L;D++)D===0&&E===w?g[E][D]=I:g[E][D]=I.clone().lerp(R,D/L)}for(let E=0;E<w;E++)for(let I=0;I<2*(w-E)-1;I++){const R=Math.floor(I/2);I%2===0?(h(g[E][R+1]),h(g[E+1][R]),h(g[E][R])):(h(g[E][R+1]),h(g[E+1][R+1]),h(g[E+1][R]))}}function c(M){const T=new O;for(let S=0;S<r.length;S+=3)T.x=r[S+0],T.y=r[S+1],T.z=r[S+2],T.normalize().multiplyScalar(M),r[S+0]=T.x,r[S+1]=T.y,r[S+2]=T.z}function u(){const M=new O;for(let T=0;T<r.length;T+=3){M.x=r[T+0],M.y=r[T+1],M.z=r[T+2];const S=m(M)/2/Math.PI+.5,b=f(M)/Math.PI+.5;a.push(S,1-b)}_(),d()}function d(){for(let M=0;M<a.length;M+=6){const T=a[M+0],S=a[M+2],b=a[M+4],w=Math.max(T,S,b),g=Math.min(T,S,b);w>.9&&g<.1&&(T<.2&&(a[M+0]+=1),S<.2&&(a[M+2]+=1),b<.2&&(a[M+4]+=1))}}function h(M){r.push(M.x,M.y,M.z)}function p(M,T){const S=M*3;T.x=t[S+0],T.y=t[S+1],T.z=t[S+2]}function _(){const M=new O,T=new O,S=new O,b=new O,w=new Gt,g=new Gt,E=new Gt;for(let I=0,R=0;I<r.length;I+=9,R+=6){M.set(r[I+0],r[I+1],r[I+2]),T.set(r[I+3],r[I+4],r[I+5]),S.set(r[I+6],r[I+7],r[I+8]),w.set(a[R+0],a[R+1]),g.set(a[R+2],a[R+3]),E.set(a[R+4],a[R+5]),b.copy(M).add(T).add(S).divideScalar(3);const L=m(b);v(w,R+0,M,L),v(g,R+2,T,L),v(E,R+4,S,L)}}function v(M,T,S,b){b<0&&M.x===1&&(a[T]=M.x-1),S.x===0&&S.z===0&&(a[T]=b/2/Math.PI+.5)}function m(M){return Math.atan2(M.z,-M.x)}function f(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Lo(t.vertices,t.indices,t.radius,t.detail)}}class Do extends Lo{constructor(t=1,e=0){const n=(1+Math.sqrt(5))/2,s=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,t,e),this.type="IcosahedronGeometry",this.parameters={radius:t,detail:e}}static fromJSON(t){return new Do(t.radius,t.detail)}}class xn extends tn{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,u=l+1,d=t/o,h=e/l,p=[],_=[],v=[],m=[];for(let f=0;f<u;f++){const M=f*h-a;for(let T=0;T<c;T++){const S=T*d-r;_.push(S,-M,0),v.push(0,0,1),m.push(T/o),m.push(1-f/l)}}for(let f=0;f<l;f++)for(let M=0;M<o;M++){const T=M+c*f,S=M+c*(f+1),b=M+1+c*(f+1),w=M+1+c*f;p.push(T,S,w),p.push(S,b,w)}this.setIndex(p),this.setAttribute("position",new Oe(_,3)),this.setAttribute("normal",new Oe(v,3)),this.setAttribute("uv",new Oe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new xn(t.width,t.height,t.widthSegments,t.heightSegments)}}class Io extends tn{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const u=[],d=new O,h=new O,p=[],_=[],v=[],m=[];for(let f=0;f<=n;f++){const M=[],T=f/n,S=a+T*o,b=t*Math.cos(S),w=Math.sqrt(t*t-b*b);let g=0;f===0&&a===0?g=.5/e:f===n&&l===Math.PI&&(g=-.5/e);for(let E=0;E<=e;E++){const I=E/e,R=s+I*r;d.x=-w*Math.cos(R),d.y=b,d.z=w*Math.sin(R),_.push(d.x,d.y,d.z),h.copy(d).normalize(),v.push(h.x,h.y,h.z),m.push(I+g,1-T),M.push(c++)}u.push(M)}for(let f=0;f<n;f++)for(let M=0;M<e;M++){const T=u[f][M+1],S=u[f][M],b=u[f+1][M],w=u[f+1][M+1];(f!==0||a>0)&&p.push(T,S,w),(f!==n-1||l<Math.PI)&&p.push(S,b,w)}this.setIndex(p),this.setAttribute("position",new Oe(_,3)),this.setAttribute("normal",new Oe(v,3)),this.setAttribute("uv",new Oe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new Io(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}}function ns(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];if(Ul(s))s.isRenderTargetTexture?(Nt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(Ul(s[0])){const r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function Je(i){const t={};for(let e=0;e<i.length;e++){const n=ns(i[e]);for(const s in n)t[s]=n[s]}return t}function Ul(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function zh(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Jc(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:Jt.workingColorSpace}const Gh={clone:ns,merge:Je};var Hh=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,kh=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Gn extends ss{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Hh,this.fragmentShader=kh,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ns(t.uniforms),this.uniformsGroups=zh(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const n in t.uniforms){const s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new Dt().setHex(s.value);break;case"v2":this.uniforms[n].value=new Gt().fromArray(s.value);break;case"v3":this.uniforms[n].value=new O().fromArray(s.value);break;case"v4":this.uniforms[n].value=new ge().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Ft().fromArray(s.value);break;case"m4":this.uniforms[n].value=new ne().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class Vh extends Gn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class $e extends ss{constructor(t){super(),this.isMeshLambertMaterial=!0,this.type="MeshLambertMaterial",this.color=new Dt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Dt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=oo,this.normalScale=new Gt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new _i,this.combine=_o,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.envMapIntensity=t.envMapIntensity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class Wh extends ss{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=ju,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class Xh extends ss{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const ga={enabled:!1,files:{},add:function(i,t){this.enabled!==!1&&(Fl(i)||(this.files[i]=t))},get:function(i){if(this.enabled!==!1&&!Fl(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function Fl(i){try{const t=i.slice(i.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}class qh{constructor(t,e,n){const s=this;let r=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return c.push(u,d),this},this.removeHandler=function(u){const d=c.indexOf(u);return d!==-1&&c.splice(d,2),this},this.getHandler=function(u){for(let d=0,h=c.length;d<h;d+=2){const p=c[d],_=c[d+1];if(p.global&&(p.lastIndex=0),p.test(u))return _}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Yh=new qh;class No{constructor(t){this.manager=t!==void 0?t:Yh,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},this.priority="auto",this.cache="default",typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){const n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}setPriority(t){return this.priority=t,this}setCache(t){return this.cache=t,this}abort(){return this}}No.DEFAULT_MATERIAL_NAME="__DEFAULT";const ki=new WeakMap;class $h extends No{constructor(t){super(t)}load(t,e,n,s){this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const r=this,a=ga.get(`image:${t}`);if(a!==void 0){if(a.complete===!0)r.manager.itemStart(t),setTimeout(function(){e&&e(a),r.manager.itemEnd(t)},0);else{let d=ki.get(a);d===void 0&&(d=[],ki.set(a,d)),d.push({onLoad:e,onError:s})}return a}const o=As("img");function l(){u(),e&&e(this);const d=ki.get(this)||[];for(let h=0;h<d.length;h++){const p=d[h];p.onLoad&&p.onLoad(this)}ki.delete(this),r.manager.itemEnd(t)}function c(d){u(),s&&s(d),ga.remove(`image:${t}`);const h=ki.get(this)||[];for(let p=0;p<h.length;p++){const _=h[p];_.onError&&_.onError(d)}ki.delete(this),r.manager.itemError(t),r.manager.itemEnd(t)}function u(){o.removeEventListener("load",l,!1),o.removeEventListener("error",c,!1)}return o.addEventListener("load",l,!1),o.addEventListener("error",c,!1),t.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(o.crossOrigin=this.crossOrigin),ga.add(`image:${t}`,o),r.manager.itemStart(t),o.fetchPriority=this.priority,o.src=t,o}}class Kh extends No{constructor(t){super(t)}load(t,e,n,s){const r=new Ge,a=new $h(this.manager);return a.setPriority(this.priority),a.setCache(this.cache),a.setCrossOrigin(this.crossOrigin),a.setPath(this.path),a.load(t,function(o){r.image=o,r.needsUpdate=!0,e!==void 0&&e(r)},n,s),r}}class Uo extends Fe{static registerNode(t){this.prototype._lightNode=t}constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new Dt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}class Zh extends Uo{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Fe.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Dt(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){const e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}}const _a=new ne,Ol=new O,Bl=new O;class Jh{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new Gt(512,512),this.mapType=ln,this.map=null,this.mapPass=null,this.matrix=new ne,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Rs,this._frameExtents=new Gt(1,1),this._viewportCount=1,this._viewports=[new ge(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera;Ol.setFromMatrixPosition(t.matrixWorld),e.position.copy(Ol),Bl.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Bl),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,s){_a.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(_a,t.coordinateSystem,t.reversedDepth);const r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;t.coordinateSystem===ws||t.reversedDepth?e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+l,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),e.multiply(_a)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.mapType=t.mapType,this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.mapType=this.mapType,t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const sr=new O,rr=new On,Ln=new O;class Qc extends Fe{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ne,this.projectionMatrix=new ne,this.projectionMatrixInverse=new ne,this.coordinateSystem=wn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(sr,rr,Ln),Ln.x===1&&Ln.y===1&&Ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(sr,rr,Ln.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(sr,rr,Ln),Ln.x===1&&Ln.y===1&&Ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(sr,rr,Ln.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const oi=new O,zl=new Gt,Gl=new Gt;class En extends Qc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=lo*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan($r*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return lo*2*Math.atan(Math.tan($r*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){oi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(oi.x,oi.y).multiplyScalar(-t/oi.z),oi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(oi.x,oi.y).multiplyScalar(-t/oi.z)}getViewSize(t,e){return this.getViewBounds(t,zl,Gl),e.subVectors(Gl,zl)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan($r*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class Fo extends Qc{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class Qh extends Jh{constructor(){super(new Fo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class jh extends Uo{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Fe.DEFAULT_UP),this.updateMatrix(),this.target=new Fe,this.shadow=new Qh}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}class td extends Uo{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}const Vi=-90,Wi=1;class uo extends Fe{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new En(Vi,Wi,t,e);s.layers=this.layers,this.add(s);const r=new En(Vi,Wi,t,e);r.layers=this.layers,this.add(r);const a=new En(Vi,Wi,t,e);a.layers=this.layers,this.add(a);const o=new En(Vi,Wi,t,e);o.layers=this.layers,this.add(o);const l=new En(Vi,Wi,t,e);l.layers=this.layers,this.add(l);const c=new En(Vi,Wi,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(const c of e)this.remove(c);if(t===wn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===ws)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,l,c,u]=this.children,d=t.getRenderTarget(),h=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;const v=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),t.setRenderTarget(n,4,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),n.texture.mipmapsAutoUpdate=v,t.setRenderTarget(n,5,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(d,h,p),t.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class ed extends En{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t,this.perCameraFrustumCulled=!1}}const Hl=new ne;class nd{constructor(t,e,n=0,s=1/0){this.ray=new Co(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new Ao,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):te("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Hl.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Hl),this}intersectObject(t,e=!0,n=[]){return ho(t,this,n,e),n.sort(kl),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)ho(t[s],this,n,e);return n.sort(kl),n}}function kl(i,t){return i.distance-t.distance}function ho(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){const r=i.children;for(let a=0,o=r.length;a<o;a++)ho(r[a],t,e,!0)}}function Vl(i,t,e,n){const s=id(n);switch(e){case Uc:return i*t;case So:return i*t/s.components*s.byteLength;case yo:return i*t/s.components*s.byteLength;case wi:return i*t*2/s.components*s.byteLength;case Eo:return i*t*2/s.components*s.byteLength;case Fc:return i*t*3/s.components*s.byteLength;case Un:return i*t*4/s.components*s.byteLength;case To:return i*t*4/s.components*s.byteLength;case dr:case fr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case pr:case mr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Da:case Na:return Math.max(i,16)*Math.max(t,8)/4;case La:case Ia:return Math.max(i,8)*Math.max(t,8)/2;case Ua:case Fa:case Ba:case za:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case Oa:case yr:case Ga:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ha:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ka:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Va:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Wa:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Xa:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case qa:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Ya:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case $a:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case Ka:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Za:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Ja:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Qa:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ja:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case to:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case eo:case no:case io:return Math.ceil(i/4)*Math.ceil(t/4)*16;case so:case ro:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Er:case ao:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function id(i){switch(i){case ln:case Lc:return{byteLength:1,components:1};case Ts:case Dc:case zn:return{byteLength:2,components:1};case vo:case Mo:return{byteLength:2,components:4};case Bn:case xo:case bn:return{byteLength:4,components:1};case Ic:case Nc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:go}}));typeof window<"u"&&(window.__THREE__?Nt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=go);function jc(){let i=null,t=!1,e=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),e(r,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function sd(i){const t=new WeakMap;function e(o,l){const c=o.array,u=o.usage,d=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),o.onUploadCallback();let p;if(c instanceof Float32Array)p=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=i.SHORT;else if(c instanceof Uint32Array)p=i.UNSIGNED_INT;else if(c instanceof Int32Array)p=i.INT;else if(c instanceof Int8Array)p=i.BYTE;else if(c instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function n(o,l,c){const u=l.array,d=l.updateRanges;if(i.bindBuffer(c,o),d.length===0)i.bufferSubData(c,0,u);else{d.sort((p,_)=>p.start-_.start);let h=0;for(let p=1;p<d.length;p++){const _=d[h],v=d[p];v.start<=_.start+_.count+1?_.count=Math.max(_.count,v.start+v.count-_.start):(++h,d[h]=v)}d.length=h+1;for(let p=0,_=d.length;p<_;p++){const v=d[p];i.bufferSubData(c,v.start*u.BYTES_PER_ELEMENT,u,v.start,v.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=t.get(o);l&&(i.deleteBuffer(l.buffer),t.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=t.get(o);if(c===void 0)t.set(o,e(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:s,remove:r,update:a}}var rd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ad=`#ifdef USE_ALPHAHASH
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
#endif`,od=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ld=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,cd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,ud=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,hd=`#ifdef USE_AOMAP
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
#endif`,dd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,fd=`#ifdef USE_BATCHING
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
#endif`,pd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,md=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,gd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,_d=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,xd=`#ifdef USE_IRIDESCENCE
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
#endif`,vd=`#ifdef USE_BUMPMAP
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
#endif`,Md=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Sd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,yd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ed=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Td=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,bd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,wd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Ad=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Rd=`#define PI 3.141592653589793
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
} // validated`,Cd=`vec3 transformedNormal = objectNormal;
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
#endif`,Pd=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Ld=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Dd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Id=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Nd="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ud=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Fd=`#ifdef USE_ENVMAP
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
#endif`,Od=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,Bd=`#ifdef USE_ENVMAP
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
#endif`,zd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Gd=`#ifdef USE_ENVMAP
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
#endif`,Hd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,kd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Vd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Wd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Xd=`#ifdef USE_GRADIENTMAP
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
}`,qd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Yd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,$d=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Kd=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Zd=`#ifdef USE_ENVMAP
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
#endif`,Jd=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Qd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,jd=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,tf=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ef=`PhysicalMaterial material;
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
#endif`,nf=`uniform sampler2D dfgLUT;
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
}`,sf=`
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
#endif`,rf=`#if defined( RE_IndirectDiffuse )
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
#endif`,af=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,of=`#if NUM_LIGHT_PROBE_GRIDS > 0
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
#endif`,lf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,cf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,uf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,hf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,df=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,ff=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,pf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,mf=`#if defined( USE_POINTS_UV )
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
#endif`,gf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,_f=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,xf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,vf=`#if defined( USE_MORPHCOLORS )
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
#endif`,Mf=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Sf=`#ifdef USE_MORPHTARGETS
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
#endif`,yf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ef=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Tf=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,bf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,wf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Af=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Rf=`#ifdef USE_NORMALMAP
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
#endif`,Cf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Pf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Lf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Df=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,If=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Nf=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Uf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ff=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Of=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Bf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,zf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Gf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Hf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,kf=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Vf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Wf=`float getShadowMask() {
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
}`,Xf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,qf=`#ifdef USE_SKINNING
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
#endif`,Yf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,$f=`#ifdef USE_SKINNING
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
#endif`,Kf=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Zf=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Jf=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Qf=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,jf=`#ifdef USE_TRANSMISSION
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
#endif`,tp=`#ifdef USE_TRANSMISSION
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
#endif`,ep=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,np=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,ip=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,sp=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const rp=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,ap=`uniform sampler2D t2D;
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
}`,op=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lp=`uniform float backgroundBlurriness;
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
}`,cp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,up=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,hp=`#include <common>
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
}`,dp=`#if DEPTH_PACKING == 3200
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
}`,fp=`#define DISTANCE
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
}`,pp=`#define DISTANCE
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
}`,mp=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,gp=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_p=`uniform float scale;
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
}`,xp=`uniform vec3 diffuse;
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
}`,vp=`#include <common>
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
}`,Mp=`uniform vec3 diffuse;
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
}`,Sp=`#define LAMBERT
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
}`,yp=`#define LAMBERT
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
}`,Ep=`#define MATCAP
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
}`,Tp=`#define MATCAP
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
}`,bp=`#define NORMAL
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
}`,wp=`#define NORMAL
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
}`,Ap=`#define PHONG
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
}`,Rp=`#define PHONG
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
}`,Cp=`#define STANDARD
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
}`,Pp=`#define STANDARD
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
}`,Lp=`#define TOON
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
}`,Dp=`#define TOON
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
}`,Ip=`uniform float size;
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
}`,Np=`uniform vec3 diffuse;
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
}`,Up=`#include <common>
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
}`,Fp=`uniform vec3 color;
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
}`,Op=`uniform float rotation;
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
}`,Bp=`uniform vec3 diffuse;
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
}`,Wt={alphahash_fragment:rd,alphahash_pars_fragment:ad,alphamap_fragment:od,alphamap_pars_fragment:ld,alphatest_fragment:cd,alphatest_pars_fragment:ud,aomap_fragment:hd,aomap_pars_fragment:dd,batching_pars_vertex:fd,batching_vertex:pd,begin_vertex:md,beginnormal_vertex:gd,bsdfs:_d,iridescence_fragment:xd,bumpmap_pars_fragment:vd,clipping_planes_fragment:Md,clipping_planes_pars_fragment:Sd,clipping_planes_pars_vertex:yd,clipping_planes_vertex:Ed,color_fragment:Td,color_pars_fragment:bd,color_pars_vertex:wd,color_vertex:Ad,common:Rd,defaultnormal_vertex:Cd,displacementmap_pars_vertex:Pd,displacementmap_vertex:Ld,emissivemap_fragment:Dd,emissivemap_pars_fragment:Id,colorspace_fragment:Nd,colorspace_pars_fragment:Ud,envmap_fragment:Fd,envmap_common_pars_fragment:Od,envmap_pars_fragment:Bd,envmap_pars_vertex:zd,envmap_physical_pars_fragment:Zd,envmap_vertex:Gd,fog_vertex:Hd,fog_pars_vertex:kd,fog_fragment:Vd,fog_pars_fragment:Wd,gradientmap_pars_fragment:Xd,lightmap_pars_fragment:qd,lights_lambert_fragment:Yd,lights_lambert_pars_fragment:$d,lights_pars_begin:Kd,lights_toon_fragment:Jd,lights_toon_pars_fragment:Qd,lights_phong_fragment:jd,lights_phong_pars_fragment:tf,lights_physical_fragment:ef,lights_physical_pars_fragment:nf,lights_fragment_begin:sf,lights_fragment_maps:rf,lights_fragment_end:af,lightprobes_pars_fragment:of,logdepthbuf_fragment:lf,logdepthbuf_pars_fragment:cf,logdepthbuf_pars_vertex:uf,logdepthbuf_vertex:hf,map_fragment:df,map_pars_fragment:ff,map_particle_fragment:pf,map_particle_pars_fragment:mf,metalnessmap_fragment:gf,metalnessmap_pars_fragment:_f,morphinstance_vertex:xf,morphcolor_vertex:vf,morphnormal_vertex:Mf,morphtarget_pars_vertex:Sf,morphtarget_vertex:yf,normal_fragment_begin:Ef,normal_fragment_maps:Tf,normal_pars_fragment:bf,normal_pars_vertex:wf,normal_vertex:Af,normalmap_pars_fragment:Rf,clearcoat_normal_fragment_begin:Cf,clearcoat_normal_fragment_maps:Pf,clearcoat_pars_fragment:Lf,iridescence_pars_fragment:Df,opaque_fragment:If,packing:Nf,premultiplied_alpha_fragment:Uf,project_vertex:Ff,dithering_fragment:Of,dithering_pars_fragment:Bf,roughnessmap_fragment:zf,roughnessmap_pars_fragment:Gf,shadowmap_pars_fragment:Hf,shadowmap_pars_vertex:kf,shadowmap_vertex:Vf,shadowmask_pars_fragment:Wf,skinbase_vertex:Xf,skinning_pars_vertex:qf,skinning_vertex:Yf,skinnormal_vertex:$f,specularmap_fragment:Kf,specularmap_pars_fragment:Zf,tonemapping_fragment:Jf,tonemapping_pars_fragment:Qf,transmission_fragment:jf,transmission_pars_fragment:tp,uv_pars_fragment:ep,uv_pars_vertex:np,uv_vertex:ip,worldpos_vertex:sp,background_vert:rp,background_frag:ap,backgroundCube_vert:op,backgroundCube_frag:lp,cube_vert:cp,cube_frag:up,depth_vert:hp,depth_frag:dp,distance_vert:fp,distance_frag:pp,equirect_vert:mp,equirect_frag:gp,linedashed_vert:_p,linedashed_frag:xp,meshbasic_vert:vp,meshbasic_frag:Mp,meshlambert_vert:Sp,meshlambert_frag:yp,meshmatcap_vert:Ep,meshmatcap_frag:Tp,meshnormal_vert:bp,meshnormal_frag:wp,meshphong_vert:Ap,meshphong_frag:Rp,meshphysical_vert:Cp,meshphysical_frag:Pp,meshtoon_vert:Lp,meshtoon_frag:Dp,points_vert:Ip,points_frag:Np,shadow_vert:Up,shadow_frag:Fp,sprite_vert:Op,sprite_frag:Bp},_t={common:{diffuse:{value:new Dt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ft},alphaMap:{value:null},alphaMapTransform:{value:new Ft},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ft}},envmap:{envMap:{value:null},envMapRotation:{value:new Ft},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ft}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ft}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ft},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ft},normalScale:{value:new Gt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ft},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ft}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ft}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ft}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Dt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Dt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ft},alphaTest:{value:0},uvTransform:{value:new Ft}},sprite:{diffuse:{value:new Dt(16777215)},opacity:{value:1},center:{value:new Gt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ft},alphaMap:{value:null},alphaMapTransform:{value:new Ft},alphaTest:{value:0}}},Nn={basic:{uniforms:Je([_t.common,_t.specularmap,_t.envmap,_t.aomap,_t.lightmap,_t.fog]),vertexShader:Wt.meshbasic_vert,fragmentShader:Wt.meshbasic_frag},lambert:{uniforms:Je([_t.common,_t.specularmap,_t.envmap,_t.aomap,_t.lightmap,_t.emissivemap,_t.bumpmap,_t.normalmap,_t.displacementmap,_t.fog,_t.lights,{emissive:{value:new Dt(0)},envMapIntensity:{value:1}}]),vertexShader:Wt.meshlambert_vert,fragmentShader:Wt.meshlambert_frag},phong:{uniforms:Je([_t.common,_t.specularmap,_t.envmap,_t.aomap,_t.lightmap,_t.emissivemap,_t.bumpmap,_t.normalmap,_t.displacementmap,_t.fog,_t.lights,{emissive:{value:new Dt(0)},specular:{value:new Dt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Wt.meshphong_vert,fragmentShader:Wt.meshphong_frag},standard:{uniforms:Je([_t.common,_t.envmap,_t.aomap,_t.lightmap,_t.emissivemap,_t.bumpmap,_t.normalmap,_t.displacementmap,_t.roughnessmap,_t.metalnessmap,_t.fog,_t.lights,{emissive:{value:new Dt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Wt.meshphysical_vert,fragmentShader:Wt.meshphysical_frag},toon:{uniforms:Je([_t.common,_t.aomap,_t.lightmap,_t.emissivemap,_t.bumpmap,_t.normalmap,_t.displacementmap,_t.gradientmap,_t.fog,_t.lights,{emissive:{value:new Dt(0)}}]),vertexShader:Wt.meshtoon_vert,fragmentShader:Wt.meshtoon_frag},matcap:{uniforms:Je([_t.common,_t.bumpmap,_t.normalmap,_t.displacementmap,_t.fog,{matcap:{value:null}}]),vertexShader:Wt.meshmatcap_vert,fragmentShader:Wt.meshmatcap_frag},points:{uniforms:Je([_t.points,_t.fog]),vertexShader:Wt.points_vert,fragmentShader:Wt.points_frag},dashed:{uniforms:Je([_t.common,_t.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Wt.linedashed_vert,fragmentShader:Wt.linedashed_frag},depth:{uniforms:Je([_t.common,_t.displacementmap]),vertexShader:Wt.depth_vert,fragmentShader:Wt.depth_frag},normal:{uniforms:Je([_t.common,_t.bumpmap,_t.normalmap,_t.displacementmap,{opacity:{value:1}}]),vertexShader:Wt.meshnormal_vert,fragmentShader:Wt.meshnormal_frag},sprite:{uniforms:Je([_t.sprite,_t.fog]),vertexShader:Wt.sprite_vert,fragmentShader:Wt.sprite_frag},background:{uniforms:{uvTransform:{value:new Ft},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Wt.background_vert,fragmentShader:Wt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ft}},vertexShader:Wt.backgroundCube_vert,fragmentShader:Wt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Wt.cube_vert,fragmentShader:Wt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Wt.equirect_vert,fragmentShader:Wt.equirect_frag},distance:{uniforms:Je([_t.common,_t.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Wt.distance_vert,fragmentShader:Wt.distance_frag},shadow:{uniforms:Je([_t.lights,_t.fog,{color:{value:new Dt(0)},opacity:{value:1}}]),vertexShader:Wt.shadow_vert,fragmentShader:Wt.shadow_frag}};Nn.physical={uniforms:Je([Nn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ft},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ft},clearcoatNormalScale:{value:new Gt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ft},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Ft},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ft},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ft},sheen:{value:0},sheenColor:{value:new Dt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ft},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ft},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ft},transmissionSamplerSize:{value:new Gt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ft},attenuationDistance:{value:0},attenuationColor:{value:new Dt(0)},specularColor:{value:new Dt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ft},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ft},anisotropyVector:{value:new Gt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ft}}]),vertexShader:Wt.meshphysical_vert,fragmentShader:Wt.meshphysical_frag};const ar={r:0,b:0,g:0},zp=new ne,tu=new Ft;tu.set(-1,0,0,0,1,0,0,0,1);function Gp(i,t,e,n,s,r){const a=new Dt(0);let o=s===!0?0:1,l,c,u=null,d=0,h=null;function p(M){let T=M.isScene===!0?M.background:null;if(T&&T.isTexture){const S=M.backgroundBlurriness>0;T=t.get(T,S)}return T}function _(M){let T=!1;const S=p(M);S===null?m(a,o):S&&S.isColor&&(m(S,1),T=!0);const b=i.xr.getEnvironmentBlendMode();b==="additive"?e.buffers.color.setClear(0,0,0,1,r):b==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||T)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function v(M,T){const S=p(T);S&&S.isCubeTexture?(c===void 0&&(c=new Xt(new nn(1,1,1),new Gn({name:"BackgroundCubeMaterial",uniforms:ns(Nn.backgroundCube.uniforms),vertexShader:Nn.backgroundCube.vertexShader,fragmentShader:Nn.backgroundCube.fragmentShader,side:je,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,w,g){this.matrixWorld.copyPosition(g.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=S,c.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(zp.makeRotationFromEuler(T.backgroundRotation)).transpose(),S.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(tu),c.material.toneMapped=Jt.getTransfer(S.colorSpace)!==re,(u!==S||d!==S.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,u=S,d=S.version,h=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):S&&S.isTexture&&(l===void 0&&(l=new Xt(new xn(2,2),new Gn({name:"BackgroundMaterial",uniforms:ns(Nn.background.uniforms),vertexShader:Nn.background.vertexShader,fragmentShader:Nn.background.fragmentShader,side:ti,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=S,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.toneMapped=Jt.getTransfer(S.colorSpace)!==re,S.matrixAutoUpdate===!0&&S.updateMatrix(),l.material.uniforms.uvTransform.value.copy(S.matrix),(u!==S||d!==S.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,u=S,d=S.version,h=i.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function m(M,T){M.getRGB(ar,Jc(i)),e.buffers.color.setClear(ar.r,ar.g,ar.b,T,r)}function f(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,T=1){a.set(M),o=T,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,m(a,o)},render:_,addToRenderList:v,dispose:f}}function Hp(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null);let r=s,a=!1;function o(L,D,B,C,z){let V=!1;const F=d(L,C,B,D);r!==F&&(r=F,c(r.object)),V=p(L,C,B,z),V&&_(L,C,B,z),z!==null&&t.update(z,i.ELEMENT_ARRAY_BUFFER),(V||a)&&(a=!1,S(L,D,B,C),z!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(z).buffer))}function l(){return i.createVertexArray()}function c(L){return i.bindVertexArray(L)}function u(L){return i.deleteVertexArray(L)}function d(L,D,B,C){const z=C.wireframe===!0;let V=n[D.id];V===void 0&&(V={},n[D.id]=V);const F=L.isInstancedMesh===!0?L.id:0;let tt=V[F];tt===void 0&&(tt={},V[F]=tt);let W=tt[B.id];W===void 0&&(W={},tt[B.id]=W);let J=W[z];return J===void 0&&(J=h(l()),W[z]=J),J}function h(L){const D=[],B=[],C=[];for(let z=0;z<e;z++)D[z]=0,B[z]=0,C[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:D,enabledAttributes:B,attributeDivisors:C,object:L,attributes:{},index:null}}function p(L,D,B,C){const z=r.attributes,V=D.attributes;let F=0;const tt=B.getAttributes();for(const W in tt)if(tt[W].location>=0){const j=z[W];let ut=V[W];if(ut===void 0&&(W==="instanceMatrix"&&L.instanceMatrix&&(ut=L.instanceMatrix),W==="instanceColor"&&L.instanceColor&&(ut=L.instanceColor)),j===void 0||j.attribute!==ut||ut&&j.data!==ut.data)return!0;F++}return r.attributesNum!==F||r.index!==C}function _(L,D,B,C){const z={},V=D.attributes;let F=0;const tt=B.getAttributes();for(const W in tt)if(tt[W].location>=0){let j=V[W];j===void 0&&(W==="instanceMatrix"&&L.instanceMatrix&&(j=L.instanceMatrix),W==="instanceColor"&&L.instanceColor&&(j=L.instanceColor));const ut={};ut.attribute=j,j&&j.data&&(ut.data=j.data),z[W]=ut,F++}r.attributes=z,r.attributesNum=F,r.index=C}function v(){const L=r.newAttributes;for(let D=0,B=L.length;D<B;D++)L[D]=0}function m(L){f(L,0)}function f(L,D){const B=r.newAttributes,C=r.enabledAttributes,z=r.attributeDivisors;B[L]=1,C[L]===0&&(i.enableVertexAttribArray(L),C[L]=1),z[L]!==D&&(i.vertexAttribDivisor(L,D),z[L]=D)}function M(){const L=r.newAttributes,D=r.enabledAttributes;for(let B=0,C=D.length;B<C;B++)D[B]!==L[B]&&(i.disableVertexAttribArray(B),D[B]=0)}function T(L,D,B,C,z,V,F){F===!0?i.vertexAttribIPointer(L,D,B,z,V):i.vertexAttribPointer(L,D,B,C,z,V)}function S(L,D,B,C){v();const z=C.attributes,V=B.getAttributes(),F=D.defaultAttributeValues;for(const tt in V){const W=V[tt];if(W.location>=0){let J=z[tt];if(J===void 0&&(tt==="instanceMatrix"&&L.instanceMatrix&&(J=L.instanceMatrix),tt==="instanceColor"&&L.instanceColor&&(J=L.instanceColor)),J!==void 0){const j=J.normalized,ut=J.itemSize,Rt=t.get(J);if(Rt===void 0)continue;const q=Rt.buffer,pt=Rt.type,St=Rt.bytesPerElement,Ct=pt===i.INT||pt===i.UNSIGNED_INT||J.gpuType===xo;if(J.isInterleavedBufferAttribute){const ft=J.data,zt=ft.isInterleavedBuffer===!0?ft.stride:ft.itemSize,ve=J.offset;if(ft.isInstancedInterleavedBuffer||ft.isInstancedBufferAttribute){for(let It=0;It<W.locationSize;It++)f(W.location+It,ft.meshPerAttribute);L.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=ft.meshPerAttribute*ft.count)}else for(let It=0;It<W.locationSize;It++)m(W.location+It);i.bindBuffer(i.ARRAY_BUFFER,q);for(let It=0;It<W.locationSize;It++)T(W.location+It,ut/W.locationSize,pt,j,zt*St,(ve+ut/W.locationSize*It)*St,Ct)}else{if(J.isInstancedBufferAttribute){for(let ft=0;ft<W.locationSize;ft++)f(W.location+ft,J.meshPerAttribute);L.isInstancedMesh!==!0&&C._maxInstanceCount===void 0&&(C._maxInstanceCount=J.meshPerAttribute*J.count)}else for(let ft=0;ft<W.locationSize;ft++)m(W.location+ft);i.bindBuffer(i.ARRAY_BUFFER,q);for(let ft=0;ft<W.locationSize;ft++)T(W.location+ft,ut/W.locationSize,pt,j,ut*St,ut/W.locationSize*ft*St,Ct)}}else if(F!==void 0){const j=F[tt];if(j!==void 0)switch(j.length){case 2:i.vertexAttrib2fv(W.location,j);break;case 3:i.vertexAttrib3fv(W.location,j);break;case 4:i.vertexAttrib4fv(W.location,j);break;default:i.vertexAttrib1fv(W.location,j)}}}}M()}function b(){I();for(const L in n){const D=n[L];for(const B in D){const C=D[B];for(const z in C){const V=C[z];for(const F in V)u(V[F].object),delete V[F];delete C[z]}}delete n[L]}}function w(L){if(n[L.id]===void 0)return;const D=n[L.id];for(const B in D){const C=D[B];for(const z in C){const V=C[z];for(const F in V)u(V[F].object),delete V[F];delete C[z]}}delete n[L.id]}function g(L){for(const D in n){const B=n[D];for(const C in B){const z=B[C];if(z[L.id]===void 0)continue;const V=z[L.id];for(const F in V)u(V[F].object),delete V[F];delete z[L.id]}}}function E(L){for(const D in n){const B=n[D],C=L.isInstancedMesh===!0?L.id:0,z=B[C];if(z!==void 0){for(const V in z){const F=z[V];for(const tt in F)u(F[tt].object),delete F[tt];delete z[V]}delete B[C],Object.keys(B).length===0&&delete n[D]}}}function I(){R(),a=!0,r!==s&&(r=s,c(r.object))}function R(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:I,resetDefaultState:R,dispose:b,releaseStatesOfGeometry:w,releaseStatesOfObject:E,releaseStatesOfProgram:g,initAttributes:v,enableAttribute:m,disableUnusedAttributes:M}}function kp(i,t,e){let n;function s(l){n=l}function r(l,c){i.drawArrays(n,l,c),e.update(c,n,1)}function a(l,c,u){u!==0&&(i.drawArraysInstanced(n,l,c,u),e.update(c,n,u))}function o(l,c,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,u);let h=0;for(let p=0;p<u;p++)h+=c[p];e.update(h,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function Vp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const g=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(g.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(g){return!(g!==Un&&n.convert(g)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(g){const E=g===zn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(g!==ln&&g!==bn&&!E&&n.convert(g)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(g){if(g==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";g="mediump"}return g==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=e.precision!==void 0?e.precision:"highp";const u=l(c);u!==c&&(Nt("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const d=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control"),h=e.logarithmicDepthBuffer===!0&&d===!1;e.reversedDepthBuffer===!0&&d===!1&&Nt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),e.logarithmicDepthBuffer===!0&&d===!0&&Nt("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");const p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),w=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:_,maxTextureSize:v,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:M,maxVaryings:T,maxFragmentUniforms:S,maxSamples:b,samples:w}}function Wp(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new ci,o=new Ft,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){const p=d.length!==0||h||n!==0||s;return s=h,n=d.length,p},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,h){e=u(d,h,0)},this.setState=function(d,h,p){const _=d.clippingPlanes,v=d.clipIntersection,m=d.clipShadows,f=i.get(d);if(!s||_===null||_.length===0||r&&!m)r?u(null):c();else{const M=r?0:n,T=M*4;let S=f.clippingState||null;l.value=S,S=u(_,h,T,p);for(let b=0;b!==T;++b)S[b]=e[b];f.clippingState=S,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(d,h,p,_){const v=d!==null?d.length:0;let m=null;if(v!==0){if(m=l.value,_!==!0||m===null){const f=p+v*4,M=h.matrixWorldInverse;o.getNormalMatrix(M),(m===null||m.length<f)&&(m=new Float32Array(f));for(let T=0,S=p;T!==v;++T,S+=4)a.copy(d[T]).applyMatrix4(M,o),a.normal.toArray(m,S),m[S+3]=a.constant}l.value=m,l.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,m}}class Oo extends Rn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new $c(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new nn(5,5,5),r=new Gn({name:"CubemapFromEquirect",uniforms:ns(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:je,blending:$i});r.uniforms.tEquirect.value=e;const a=new Xt(s,r),o=e.minFilter;return e.minFilter===Zn&&(e.minFilter=Qe),new uo(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}const Wl=256,Xp=3,qp=20,eu=256,nu=16,Yp=3,$p=new O,Kp=new Dt;class br{constructor(t){this._renderer=t,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new uo(1,10,null),this._boxMesh=new Xt(new nn(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){const{size:a=256,position:o=$p}=r,l=this._renderer;this._setSize(a);const c=this._allocateTarget(),u=this._getSourceTarget(!0);e>0&&(u.texture.mipmapsAutoUpdate=!1);const d=l.autoClear,h=l.autoClearColor,p=l.autoClearDepth,_=l.autoClearStencil,v=t.background;l.autoClear=!0,l.autoClearColor=!0,l.autoClearDepth=!0,l.autoClearStencil=!0,v===null&&(t.background=l.getClearColor(Kp));const m=new uo(n,s,u);return m.position.copy(o),m.update(l,t),l.autoClear=d,l.autoClearColor=h,l.autoClearDepth=p,l.autoClearStencil=_,t.background=v,e>0&&(u.texture.mipmapsAutoUpdate=!0,this._blur(c,e)),this._applyPMREM(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Yl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ql(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(t,e){return e>0?1-Math.sqrt(1-t/e):0}_setSize(t){this._cubeSize=Math.max(Wl,fh(t))}_fromTexture(t,e){t.mapping===ji||t.mapping===Es?this._setSize(t.image.length===0?Wl:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4);const n=e||this._allocateTarget();return this._textureToCubemap(t),this._applyPMREM(n),n}_allocateTarget(){const t=this._cubeSize,e=Xl(t,!1,!1),n=Math.log2(t)-Xp;for(let s=0;s<=n;s++)e.texture.mipmaps.push({width:t>>s,height:t>>s});return e.texture.name="PMREM",e.texture.isPMREMTexture=!0,e}_getSourceTarget(t=!1){const e=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==e||t&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Xl(e,!0,t)),this._sourceTarget}_compileMaterial(t){this._boxMesh.material=t,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(t,e,n){const s=this._boxMesh,r=this._cubeCamera;s.material=n,r.renderTarget=t,r.activeMipmapLevel=e;const a=t.width>>e;t.viewport.set(0,0,a,a),r.update(this._renderer,s),t.viewport.set(0,0,t.width,t.height)}_textureToCubemap(t){let e;t.mapping===ji||t.mapping===Es?(this._cubemapMaterial===null&&(this._cubemapMaterial=Yl()),e=this._cubemapMaterial,e.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=ql()),e=this._equirectMaterial),e.uniforms.envMap.value=t,this._renderCube(this._getSourceTarget(),0,e)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Zp(),this._integrationMaterial=Jp());const e=this._cubeSize,n=t.texture.mipmaps.length-1,s=this._ggxMaterial.uniforms;s.envMap.value=this._sourceTarget.texture;const r=this._integrationMaterial.uniforms;r.envMap.value=this._sourceTarget.texture,r.sourceLod.value=Math.log2(e/nu);for(let a=0;a<=n;a++){const o=br.lodToRoughness(a,n);if(a>n-Yp)r.roughness.value=o,this._renderCube(t,a,this._integrationMaterial);else{const l=o>0?Math.log2(e)+.5*Math.log2(6/(eu*Math.pow(o,4)))+.5:0;s.roughness.value=o,s.lodBias.value=l,this._renderCube(t,a,this._ggxMaterial)}}}_blur(t,e){this._blurMaterial===null&&(this._blurMaterial=Qp());const n=this._blurMaterial,s=n.uniforms,r=this._sourceTarget;s.sigma.value=Math.min(e,Math.PI)/Math.SQRT2,s.envMap.value=r.texture,this._renderCube(t,0,n),s.envMap.value=t.texture,this._renderCube(r,0,n)}}function Xl(i,t,e){return new Oo(i,{minFilter:Zn,generateMipmaps:t,type:zn,colorSpace:bs,depthBuffer:e})}function Is(i,t,e){return new Gn({name:i,uniforms:t,vertexShader:Wt.cube_vert,fragmentShader:e,side:je,blending:$i,depthTest:!1,depthWrite:!1})}function Zp(){return Is("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${eu}u

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
	`)}function Jp(){return Is("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:nu}},`

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
	`)}function Qp(){return Is("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${qp}
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
	`)}function ql(){return Is("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

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
	`)}function Yl(){return Is("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function jp(i){let t=new WeakMap,e=new WeakMap,n=null;function s(h,p=!1){return h==null?null:p?a(h):r(h)}function r(h){if(h&&h.isTexture){const p=h.mapping;if(p===Wr||p===Xr)if(t.has(h)){const _=t.get(h).texture;return o(_,h.mapping)}else{const _=h.image;if(_&&_.height>0){const v=new Oo(_.height);return v.fromEquirectangularTexture(i,h),t.set(h,v),h.addEventListener("dispose",c),o(v.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture&&h.isPMREMTexture!==!0){const p=h.mapping,_=p===Wr||p===Xr,v=p===ji||p===Es;if(_||v){let m=e.get(h);const f=m!==void 0?m.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==f)return n===null&&(n=new br(i)),m=_?n.fromEquirectangular(h,m):n.fromCubemap(h,m),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),m.texture;if(m!==void 0)return m.texture;{const M=h.image;return _&&M&&M.height>0||v&&M&&l(M)?(n===null&&(n=new br(i)),m=_?n.fromEquirectangular(h):n.fromCubemap(h),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),h.addEventListener("dispose",u),m.texture):null}}}return h}function o(h,p){return p===Wr?h.mapping=ji:p===Xr&&(h.mapping=Es),h}function l(h){let p=0;const _=6;for(let v=0;v<_;v++)h[v]!==void 0&&p++;return p===_}function c(h){const p=h.target;p.removeEventListener("dispose",c);const _=t.get(p);_!==void 0&&(t.delete(p),_.dispose())}function u(h){const p=h.target;p.removeEventListener("dispose",u);const _=e.get(p);_!==void 0&&(e.delete(p),_.dispose())}function d(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function tm(i){const t={};function e(n){if(t[n]!==void 0)return t[n];const s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&gr("WebGLRenderer: "+n+" extension not supported."),s}}}function em(i,t,e,n){const s={},r=new WeakMap,a=new FinalizationRegistry(_=>delete s[_]);function o(_){l(_.target)}function l(_){_.index!==null&&t.remove(_.index);for(const m in _.attributes)t.remove(_.attributes[m]);_.removeEventListener("dispose",o),delete s[_.id],a.unregister(_);const v=r.get(_);v&&(t.remove(v),r.delete(_)),n.releaseStatesOfGeometry(_),_.isInstancedBufferGeometry===!0&&delete _._maxInstanceCount,e.memory.geometries--}function c(_,v){return s[v.id]!==void 0||(v.addEventListener("dispose",o),s[v.id]=new WeakRef(v),a.register(v,v.id,v),e.memory.geometries++),v}function u(_){const v=_.attributes;for(const m in v)t.update(v[m],i.ARRAY_BUFFER)}function d(_){const v=_.index,m=_.attributes.position;let f=0;if(m===void 0)return;const M=v!==null?v.array.length:m.array.length/3-1,T=m.count>=65535?Xc:Wc,S=new T(Math.ceil(M/3)*6,1),b=S.array;if(v!==null){const g=v.array;f=v.version;for(let E=0,I=0;E<M;E+=3){const R=g[E+0],L=g[E+1],D=g[E+2];b[I++]=R,b[I++]=L,b[I++]=L,b[I++]=D,b[I++]=D,b[I++]=R}}else{f=m.version;for(let g=0,E=0;g<M;g+=3){const I=g+0,R=g+1,L=g+2;b[E++]=I,b[E++]=R,b[E++]=R,b[E++]=L,b[E++]=L,b[E++]=I}}S.version=f;const w=r.get(_);w&&t.remove(w),r.set(_,S)}function h(_){const v=r.get(_);if(v){const m=_.index;m!==null&&v.version<m.version&&d(_)}else d(_);return r.get(_)}function p(){for(const _ in s){const v=s[_].deref();v!==void 0&&l(v)}}return{get:c,update:u,getWireframeAttribute:h,dispose:p}}function nm(i,t,e){let n;function s(d){n=d}let r,a;function o(d){r=d.type,a=d.bytesPerElement}function l(d,h){i.drawElements(n,h,r,d*a),e.update(h,n,1)}function c(d,h,p){p!==0&&(i.drawElementsInstanced(n,h,r,d*a,p),e.update(h,n,p))}function u(d,h,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,r,d,0,p);let v=0;for(let m=0;m<p;m++)v+=h[m];e.update(v,n,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function im(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:te("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function sm(i,t,e){const n=new WeakMap,s=new ge;function r(a,o,l){const c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u!==void 0?u.length:0;let h=n.get(o);if(h===void 0||h.count!==d){let R=function(){E.dispose(),n.delete(o),o.removeEventListener("dispose",R)};var p=R;h!==void 0&&h.texture.dispose();const _=o.morphAttributes.position!==void 0,v=o.morphAttributes.normal!==void 0,m=o.morphAttributes.color!==void 0,f=o.morphAttributes.position||[],M=o.morphAttributes.normal||[],T=o.morphAttributes.color||[];let S=0;_===!0&&(S=1),v===!0&&(S=2),m===!0&&(S=3);let b=o.attributes.position.count*S,w=1;b>t.maxTextureSize&&(w=Math.ceil(b/t.maxTextureSize),b=t.maxTextureSize);const g=new Float32Array(b*w*4*d),E=new Hc(g,b,w,d);E.type=bn,E.needsUpdate=!0;const I=S*4;for(let L=0;L<d;L++){const D=f[L],B=M[L],C=T[L],z=b*w*4*L;for(let V=0;V<D.count;V++){const F=V*I;_===!0&&(s.fromBufferAttribute(D,V),g[z+F+0]=s.x,g[z+F+1]=s.y,g[z+F+2]=s.z,g[z+F+3]=0),v===!0&&(s.fromBufferAttribute(B,V),g[z+F+4]=s.x,g[z+F+5]=s.y,g[z+F+6]=s.z,g[z+F+7]=0),m===!0&&(s.fromBufferAttribute(C,V),g[z+F+8]=s.x,g[z+F+9]=s.y,g[z+F+10]=s.z,g[z+F+11]=C.itemSize===4?s.w:1)}}h={count:d,texture:E,size:new Gt(b,w)},n.set(o,h),o.addEventListener("dispose",R)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let _=0;for(let m=0;m<c.length;m++)_+=c[m];const v=o.morphTargetsRelative?1:1-_;l.getUniforms().setValue(i,"morphTargetBaseInfluence",v),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function rm(i,t,e,n,s){let r=new WeakMap;function a(c){const u=s.render.frame,d=c.geometry,h=t.get(c,d);if(r.get(h)!==u&&(t.update(h),r.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==u&&(e.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&e.update(c.instanceColor,i.ARRAY_BUFFER),r.set(c,u))),c.isSkinnedMesh){const p=c.skeleton;r.get(p)!==u&&(p.update(),r.set(p,u))}return h}function o(){r=new WeakMap}function l(c){const u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}const am={[Ec]:"LINEAR_TONE_MAPPING",[Tc]:"REINHARD_TONE_MAPPING",[bc]:"CINEON_TONE_MAPPING",[wc]:"ACES_FILMIC_TONE_MAPPING",[Rc]:"AGX_TONE_MAPPING",[Cc]:"NEUTRAL_TONE_MAPPING",[Ac]:"CUSTOM_TONE_MAPPING"};function om(i,t,e,n,s,r){const a=new Rn(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null,c=null;const u=new tn;u.setAttribute("position",new Oe([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute("uv",new Oe([0,2,0,0,2,0],2));const d=new Vh({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),h=new Xt(u,d),p=new Fo(-1,1,1,-1,0,1);let _=null,v=null,m=!1,f,M=null,T=[],S=!1;this.setSize=function(b,w){a.setSize(b,w),o!==null&&o.setSize(b,w),l!==null&&l.setSize(b,w);for(let g=0;g<T.length;g++){const E=T[g];E.setSize&&E.setSize(b,w)}},this.setEffects=function(b){T=b,S=T.length>0&&T[0].isRenderPass===!0;const w=a.width,g=a.height;T.length>0&&o===null&&(o=new Rn(w,g,{type:zn,depthBuffer:!1,stencilBuffer:!1}),l=new Rn(w,g,{type:zn,depthBuffer:!1,stencilBuffer:!1}));const E=s===!0&&T.some(I=>I.needsDepthTexture===!0);E!==(a.depthTexture!==null)&&(E===!0&&c===null&&(c=new es(w,g),r===!0&&(c.format=pi,c.type=ts)),a.dispose(),a.depthTexture=E?c:null,a.resolveDepthBuffer=E,a.storeMultisampledDepthBuffer=E);for(let I=0;I<T.length;I++){const R=T[I];R.setSize&&R.setSize(w,g),E&&R.needsDepthTexture===!0&&R.setDepthTexture&&R.setDepthTexture(c)}},this.begin=function(b,w){if(m||b.toneMapping===Jn&&T.length===0)return!1;if(M=w,w!==null){const g=w.width,E=w.height;(a.width!==g||a.height!==E)&&this.setSize(g,E)}return S===!1&&b.setRenderTarget(a),f=b.toneMapping,b.toneMapping=Jn,!0},this.hasRenderPass=function(){return S},this.end=function(b,w){b.toneMapping=f,m=!0;let g=a,E=o;for(let I=0;I<T.length;I++){const R=T[I];R.enabled!==!1&&(R.render(b,E,g,w),R.needsSwap!==!1&&(g=E,E=E===o?l:o))}if(_!==b.outputColorSpace||v!==b.toneMapping){_=b.outputColorSpace,v=b.toneMapping,d.defines={},Jt.getTransfer(_)===re&&(d.defines.SRGB_TRANSFER="");const I=am[v];I&&(d.defines[I]=""),d.needsUpdate=!0}d.uniforms.tDiffuse.value=g.texture,b.setRenderTarget(M),b.render(h,p),M=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),u.dispose(),d.dispose()}}const iu=new Ge,su=new es(1,1),ru=new Kc(1),au=new Hc,ou=new Sh,lu=new $c,$l=[],Kl=[],Zl=new Float32Array(16),Jl=new Float32Array(9),Ql=new Float32Array(4);function rs(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=$l[s];if(r===void 0&&(r=new Float32Array(s),$l[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function be(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function we(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Br(i,t){let e=Kl[t];e===void 0&&(e=new Int32Array(t),Kl[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function lm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function cm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(be(e,t))return;i.uniform2fv(this.addr,t),we(e,t)}}function um(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(be(e,t))return;i.uniform3fv(this.addr,t),we(e,t)}}function hm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(be(e,t))return;i.uniform4fv(this.addr,t),we(e,t)}}function dm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(be(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),we(e,t)}else{if(be(e,n))return;Ql.set(n),i.uniformMatrix2fv(this.addr,!1,Ql),we(e,n)}}function fm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(be(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),we(e,t)}else{if(be(e,n))return;Jl.set(n),i.uniformMatrix3fv(this.addr,!1,Jl),we(e,n)}}function pm(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(be(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),we(e,t)}else{if(be(e,n))return;Zl.set(n),i.uniformMatrix4fv(this.addr,!1,Zl),we(e,n)}}function mm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function gm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(be(e,t))return;i.uniform2iv(this.addr,t),we(e,t)}}function _m(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(be(e,t))return;i.uniform3iv(this.addr,t),we(e,t)}}function xm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(be(e,t))return;i.uniform4iv(this.addr,t),we(e,t)}}function vm(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Mm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(be(e,t))return;i.uniform2uiv(this.addr,t),we(e,t)}}function Sm(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(be(e,t))return;i.uniform3uiv(this.addr,t),we(e,t)}}function ym(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(be(e,t))return;i.uniform4uiv(this.addr,t),we(e,t)}}function zr(i){return i.version===0&&(i.compareFunction=zc,i.needsUpdate=!0),i}function Em(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?r=zr(su):r=iu,e.setTexture2D(t||r,s)}function Tm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||ou,s)}function bm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_CUBE_SHADOW?r=zr(ru):r=lu,e.setTextureCube(t||r,s)}function wm(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||au,s)}function Am(i){switch(i){case 5126:return lm;case 35664:return cm;case 35665:return um;case 35666:return hm;case 35674:return dm;case 35675:return fm;case 35676:return pm;case 5124:case 35670:return mm;case 35667:case 35671:return gm;case 35668:case 35672:return _m;case 35669:case 35673:return xm;case 5125:return vm;case 36294:return Mm;case 36295:return Sm;case 36296:return ym;case 35678:case 36198:case 36298:case 36306:case 35682:return Em;case 35679:case 36299:case 36307:return Tm;case 35680:case 36300:case 36308:case 36293:return bm;case 36289:case 36303:case 36311:case 36292:return wm}}function Rm(i,t){i.uniform1fv(this.addr,t)}function Cm(i,t){const e=rs(t,this.size,2);i.uniform2fv(this.addr,e)}function Pm(i,t){const e=rs(t,this.size,3);i.uniform3fv(this.addr,e)}function Lm(i,t){const e=rs(t,this.size,4);i.uniform4fv(this.addr,e)}function Dm(i,t){const e=rs(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Im(i,t){const e=rs(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Nm(i,t){const e=rs(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Um(i,t){i.uniform1iv(this.addr,t)}function Fm(i,t){i.uniform2iv(this.addr,t)}function Om(i,t){i.uniform3iv(this.addr,t)}function Bm(i,t){i.uniform4iv(this.addr,t)}function zm(i,t){i.uniform1uiv(this.addr,t)}function Gm(i,t){i.uniform2uiv(this.addr,t)}function Hm(i,t){i.uniform3uiv(this.addr,t)}function km(i,t){i.uniform4uiv(this.addr,t)}function Vm(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);be(n,r)||(i.uniform1iv(this.addr,r),we(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=zr(su):a=iu;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function Wm(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);be(n,r)||(i.uniform1iv(this.addr,r),we(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||ou,r[a])}function Xm(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);be(n,r)||(i.uniform1iv(this.addr,r),we(n,r));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=zr(ru):a=lu;for(let o=0;o!==s;++o)e.setTextureCube(t[o]||a,r[o])}function qm(i,t,e){const n=this.cache,s=t.length,r=Br(e,s);be(n,r)||(i.uniform1iv(this.addr,r),we(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||au,r[a])}function Ym(i){switch(i){case 5126:return Rm;case 35664:return Cm;case 35665:return Pm;case 35666:return Lm;case 35674:return Dm;case 35675:return Im;case 35676:return Nm;case 5124:case 35670:return Um;case 35667:case 35671:return Fm;case 35668:case 35672:return Om;case 35669:case 35673:return Bm;case 5125:return zm;case 36294:return Gm;case 36295:return Hm;case 36296:return km;case 35678:case 36198:case 36298:case 36306:case 35682:return Vm;case 35679:case 36299:case 36307:return Wm;case 35680:case 36300:case 36308:case 36293:return Xm;case 36289:case 36303:case 36311:case 36292:return qm}}class $m{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=Am(e.type)}}class Km{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=Ym(e.type)}}class Zm{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const xa=/(\w+)(\])?(\[|\.)?/g;function jl(i,t){i.seq.push(t),i.map[t.id]=t}function Jm(i,t,e){const n=i.name,s=n.length;for(xa.lastIndex=0;;){const r=xa.exec(n),a=xa.lastIndex;let o=r[1];const l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){jl(e,c===void 0?new $m(o,i,t):new Km(o,i,t));break}else{let d=e.map[o];d===void 0&&(d=new Zm(o),jl(e,d)),e=d}}}class xr{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=t.getActiveUniform(e,a),l=t.getUniformLocation(e,o.name);Jm(o,l,this)}const s=[],r=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function tc(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const Qm=37297;let jm=0;function tg(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const ec=new Ft;function eg(i){Jt._getMatrix(ec,Jt.workingColorSpace,i);const t=`mat3( ${ec.elements.map(e=>e.toFixed(4))} )`;switch(Jt.getTransfer(i)){case Tr:return[t,"LinearTransferOETF"];case re:return[t,"sRGBTransferOETF"];default:return Nt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function nc(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+tg(i.getShaderSource(t),o)}else return r}function ng(i,t){const e=eg(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( ${e[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}const ig={[Ec]:"Linear",[Tc]:"Reinhard",[bc]:"Cineon",[wc]:"ACESFilmic",[Rc]:"AgX",[Cc]:"Neutral",[Ac]:"Custom"};function sg(i,t){const e=ig[t];return e===void 0?(Nt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const or=new O;function rg(){Jt.getLuminanceCoefficients(or);const i=or.x.toFixed(4),t=or.y.toFixed(4),e=or.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function ag(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(gs).join(`
`)}function og(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function lg(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function gs(i){return i!==""}function ic(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function sc(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const cg=/^[ \t]*#include +<([\w\d./]+)>/gm;function fo(i){return i.replace(cg,ug)}function ug(i,t){const e=Wt[t];if(e===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">");return fo(e)}const hg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function rc(i){return i.replace(hg,dg)}function dg(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function ac(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const fg={[_s]:"SHADOWMAP_TYPE_PCF",[ms]:"SHADOWMAP_TYPE_VSM"};function pg(i){return fg[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const mg={[Es]:"ENVMAP_MODE_REFRACTION"};function gg(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":mg[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const _g={[_o]:"ENVMAP_BLENDING_MULTIPLY",[Zu]:"ENVMAP_BLENDING_MIX",[Ju]:"ENVMAP_BLENDING_ADD"};function xg(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":_g[i.combine]||"ENVMAP_BLENDING_NONE"}function vg(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const l=pg(e),c=e.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",u=gg(e),d=xg(e),h=ag(e),p=og(r),_=s.createProgram();let v,m,f=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(v=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(gs).join(`
`),v.length>0&&(v+=`
`),m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p].filter(gs).join(`
`),m.length>0&&(m+=`
`)):(v=[ac(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+e.diffuseRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(gs).join(`
`),m=[ac(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,p,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+u:"",e.envMap?"#define "+d:"",e.envMapPMREM?"#define ENVMAP_MAX_LOD "+e.envMapMaxLod+".0":"",e.envMapPMREM?"#define ENVMAP_SIZE "+e.envMapSize+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",e.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Jn?"#define TONE_MAPPING":"",e.toneMapping!==Jn?Wt.tonemapping_pars_fragment:"",e.toneMapping!==Jn?sg("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Wt.colorspace_pars_fragment,ng("linearToOutputTexel",e.outputColorSpace),rg(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(gs).join(`
`)),a=fo(a),a=ic(a,e),a=sc(a,e),o=fo(o),o=ic(o,e),o=sc(o,e),a=rc(a),o=rc(o),e.isRawShaderMaterial!==!0&&(f=`#version 300 es
`,v=[h,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+v,m=["#define varying in",e.glslVersion===dl?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===dl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const M=f+v+a,T=f+m+o,S=tc(s,s.VERTEX_SHADER,M),b=tc(s,s.FRAGMENT_SHADER,T);s.attachShader(_,S),s.attachShader(_,b),e.index0AttributeName!==void 0?s.bindAttribLocation(_,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(_,0,"position"),s.linkProgram(_);function w(R){if(i.debug.checkShaderErrors){const L=s.getProgramInfoLog(_)||"",D=s.getShaderInfoLog(S)||"",B=s.getShaderInfoLog(b)||"",C=L.trim(),z=D.trim(),V=B.trim();let F=!0,tt=!0;if(s.getProgramParameter(_,s.LINK_STATUS)===!1)if(F=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,_,S,b);else{const W=nc(s,S,"vertex"),J=nc(s,b,"fragment");te("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(_,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+C+`
`+W+`
`+J)}else C!==""?Nt("WebGLProgram: Program Info Log:",C):(z===""||V==="")&&(tt=!1);tt&&(R.diagnostics={runnable:F,programLog:C,vertexShader:{log:z,prefix:v},fragmentShader:{log:V,prefix:m}})}s.deleteShader(S),s.deleteShader(b),g=new xr(s,_),E=lg(s,_)}let g;this.getUniforms=function(){return g===void 0&&w(this),g};let E;this.getAttributes=function(){return E===void 0&&w(this),E};let I=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=s.getProgramParameter(_,Qm)),I},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(_),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=jm++,this.cacheKey=t,this.usedTimes=1,this.program=_,this.vertexShader=S,this.fragmentShader=b,this}let Mg=0;class Sg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){const s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new yg(t),e.set(t,n)),n}}class yg{constructor(t){this.id=Mg++,this.code=t,this.usedTimes=0}}function Eg(i){return i===wi||i===yr||i===Er}function Tg(i,t,e,n,s,r){const a=new Ao,o=new Sg,l=new Set,c=[],u=new Map,d=n.logarithmicDepthBuffer,h={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(g){return l.add(g),g===0?"uv":`uv${g}`}function _(g,E,I,R,L,D){const B=R.fog,C=L.geometry,z=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?R.environment:null,V=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap,F=t.get(g.envMap||z,V),tt=h[g.type];let W=n.precision;g.precision!==null&&(W=n.getMaxPrecision(g.precision),W!==g.precision&&Nt("WebGLProgram.getParameters:",g.precision,"not supported, using",W,"instead."));const J=C.morphAttributes.position||C.morphAttributes.normal||C.morphAttributes.color,j=J!==void 0?J.length:0;let ut=0;C.morphAttributes.position!==void 0&&(ut=1),C.morphAttributes.normal!==void 0&&(ut=2),C.morphAttributes.color!==void 0&&(ut=3);let Rt,q,pt,St;if(tt){const gt=Nn[tt];Rt=gt.vertexShader,q=gt.fragmentShader}else{Rt=g.vertexShader,q=g.fragmentShader;const gt=o.getVertexShaderStage(g),se=o.getFragmentShaderStage(g);o.update(g,gt,se),pt=gt.id,St=se.id}const Ct=i.getRenderTarget(),ft=i.state.buffers.depth.getReversed(),zt=L.isInstancedMesh===!0,ve=L.isBatchedMesh===!0,It=!!g.map,ie=!!g.matcap,oe=!!F,$t=oe&&F.isPMREMTexture===!0,Be=!!g.aoMap,Ee=!!g.lightMap,en=!!g.bumpMap&&g.wireframe===!1,fe=!!g.normalMap,Pn=!!g.displacementMap,Re=!!g.emissiveMap,hn=!!g.metalnessMap,dn=!!g.roughnessMap,fn=g.anisotropy>0,U=g.clearcoat>0,pn=g.diffuseRoughness>0,ue=g.dispersion>0,he=g.retroreflectivity>0,mt=g.iridescence>0,Te=g.sheen>0,Lt=g.transmission>0,Ut=fn&&!!g.anisotropyMap,A=U&&!!g.clearcoatMap,x=U&&!!g.clearcoatNormalMap,H=U&&!!g.clearcoatRoughnessMap,et=pn&&!!g.diffuseRoughnessMap,Q=mt&&!!g.iridescenceMap,rt=mt&&!!g.iridescenceThicknessMap,ht=Te&&!!g.sheenColorMap,$=Te&&!!g.sheenRoughnessMap,K=!!g.specularMap,ot=!!g.specularColorMap,P=!!g.specularIntensityMap,Z=Lt&&!!g.transmissionMap,Y=Lt&&!!g.thicknessMap,lt=!!g.gradientMap,st=!!g.alphaMap,at=g.alphaTest>0,At=!!g.alphaHash,Vt=!!g.extensions;let nt=Jn;g.toneMapped&&(Ct===null||Ct.isXRRenderTarget===!0)&&(nt=i.toneMapping);const Pt=$t?F.isCompressedCubeTexture?F.image[0].mipmaps:F.mipmaps:null,Ht={shaderID:tt,shaderType:g.type,shaderName:g.name,vertexShader:Rt,fragmentShader:q,defines:g.defines,customVertexShaderID:pt,customFragmentShaderID:St,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:W,batching:ve,batchingColor:ve&&L._colorsTexture!==null,instancing:zt,instancingColor:zt&&L.instanceColor!==null,instancingMorph:zt&&L.morphTexture!==null,outputColorSpace:Ct===null?i.outputColorSpace:Ct.isXRRenderTarget===!0?Ct.texture.colorSpace:Jt.workingColorSpace,alphaToCoverage:!!g.alphaToCoverage,map:It,matcap:ie,envMap:oe,envMapMode:oe&&F.mapping,envMapPMREM:$t,envMapMaxLod:$t?Pt.length-1:null,envMapSize:$t?Pt[0].width:null,aoMap:Be,lightMap:Ee,bumpMap:en,normalMap:fe,displacementMap:Pn,emissiveMap:Re,normalMapObjectSpace:fe&&g.normalMapType===th,normalMapTangentSpace:fe&&g.normalMapType===oo,packedNormalMap:fe&&g.normalMapType===oo&&Eg(g.normalMap.format),metalnessMap:hn,roughnessMap:dn,anisotropy:fn,anisotropyMap:Ut,clearcoat:U,clearcoatMap:A,clearcoatNormalMap:x,clearcoatRoughnessMap:H,diffuseRoughness:pn,diffuseRoughnessMap:et,dispersion:ue,retroreflection:he,iridescence:mt,iridescenceMap:Q,iridescenceThicknessMap:rt,sheen:Te,sheenColorMap:ht,sheenRoughnessMap:$,specularMap:K,specularColorMap:ot,specularIntensityMap:P,transmission:Lt,transmissionMap:Z,thicknessMap:Y,gradientMap:lt,opaque:g.transparent===!1&&g.blending===xs&&g.alphaToCoverage===!1,alphaMap:st,alphaTest:at,alphaHash:At,combine:g.combine,mapUv:It&&p(g.map.channel),aoMapUv:Be&&p(g.aoMap.channel),lightMapUv:Ee&&p(g.lightMap.channel),bumpMapUv:en&&p(g.bumpMap.channel),normalMapUv:fe&&p(g.normalMap.channel),displacementMapUv:Pn&&p(g.displacementMap.channel),emissiveMapUv:Re&&p(g.emissiveMap.channel),metalnessMapUv:hn&&p(g.metalnessMap.channel),roughnessMapUv:dn&&p(g.roughnessMap.channel),anisotropyMapUv:Ut&&p(g.anisotropyMap.channel),clearcoatMapUv:A&&p(g.clearcoatMap.channel),clearcoatNormalMapUv:x&&p(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:H&&p(g.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:et&&p(g.diffuseRoughnessMap.channel),iridescenceMapUv:Q&&p(g.iridescenceMap.channel),iridescenceThicknessMapUv:rt&&p(g.iridescenceThicknessMap.channel),sheenColorMapUv:ht&&p(g.sheenColorMap.channel),sheenRoughnessMapUv:$&&p(g.sheenRoughnessMap.channel),specularMapUv:K&&p(g.specularMap.channel),specularColorMapUv:ot&&p(g.specularColorMap.channel),specularIntensityMapUv:P&&p(g.specularIntensityMap.channel),transmissionMapUv:Z&&p(g.transmissionMap.channel),thicknessMapUv:Y&&p(g.thicknessMap.channel),alphaMapUv:st&&p(g.alphaMap.channel),vertexTangents:!!C.attributes.tangent&&(fe||fn),vertexNormals:!!C.attributes.normal,vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!C.attributes.color&&C.attributes.color.itemSize===4,pointsUvs:L.isPoints===!0&&!!C.attributes.uv&&(It||st),fog:!!B,useFog:g.fog===!0,fogExp2:!!B&&B.isFogExp2,flatShading:g.wireframe===!1&&(g.flatShading===!0||C.attributes.normal===void 0&&fe===!1&&(g.isMeshLambertMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isMeshPhysicalMaterial)),sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ft,skinning:L.isSkinnedMesh===!0,hasPositionAttribute:C.attributes.position!==void 0,morphTargets:C.morphAttributes.position!==void 0,morphNormals:C.morphAttributes.normal!==void 0,morphColors:C.morphAttributes.color!==void 0,morphTargetsCount:j,morphTextureStride:ut,numSunLights:E.sun.length,numDirLights:E.directional.length,numPointLights:E.point.length,numSpotLights:E.spot.length,numSpotLightMaps:E.spotLightMap.length,numRectAreaLights:E.rectArea.length,numHemiLights:E.hemi.length,numSunLightShadows:E.sunShadowMap.length,numDirLightShadows:E.directionalShadowMap.length,numPointLightShadows:E.pointShadowMap.length,numSpotLightShadows:E.spotShadowMap.length,numSpotLightShadowsWithMaps:E.numSpotLightShadowsWithMaps,numLightProbes:E.numLightProbes,numLightProbeGrids:D.filter(gt=>gt.texture!==null).length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:g.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:nt,decodeVideoTexture:It&&g.map.isVideoTexture===!0&&Jt.getTransfer(g.map.colorSpace)===re,decodeVideoTextureEmissive:Re&&g.emissiveMap.isVideoTexture===!0&&Jt.getTransfer(g.emissiveMap.colorSpace)===re,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===_n,flipSided:g.side===je,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:Vt&&g.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Vt&&g.extensions.multiDraw===!0||ve)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return Ht.vertexUv1s=l.has(1),Ht.vertexUv2s=l.has(2),Ht.vertexUv3s=l.has(3),l.clear(),Ht}function v(g){const E=[];if(g.shaderID?E.push(g.shaderID):(E.push(g.customVertexShaderID),E.push(g.customFragmentShaderID)),g.defines!==void 0)for(const I in g.defines)E.push(I),E.push(g.defines[I]);return g.isRawShaderMaterial===!1&&(m(E,g),f(E,g),E.push(i.outputColorSpace)),E.push(g.customProgramCacheKey),E.join()}function m(g,E){g.push(E.precision),g.push(E.outputColorSpace),g.push(E.envMapMode),g.push(E.envMapPMREM),g.push(E.envMapMaxLod),g.push(E.envMapSize),g.push(E.mapUv),g.push(E.alphaMapUv),g.push(E.lightMapUv),g.push(E.aoMapUv),g.push(E.bumpMapUv),g.push(E.normalMapUv),g.push(E.displacementMapUv),g.push(E.emissiveMapUv),g.push(E.metalnessMapUv),g.push(E.roughnessMapUv),g.push(E.anisotropyMapUv),g.push(E.clearcoatMapUv),g.push(E.clearcoatNormalMapUv),g.push(E.clearcoatRoughnessMapUv),g.push(E.diffuseRoughnessMapUv),g.push(E.iridescenceMapUv),g.push(E.iridescenceThicknessMapUv),g.push(E.sheenColorMapUv),g.push(E.sheenRoughnessMapUv),g.push(E.specularMapUv),g.push(E.specularColorMapUv),g.push(E.specularIntensityMapUv),g.push(E.transmissionMapUv),g.push(E.thicknessMapUv),g.push(E.combine),g.push(E.fogExp2),g.push(E.sizeAttenuation),g.push(E.morphTargetsCount),g.push(E.numSunLights),g.push(E.numDirLights),g.push(E.numPointLights),g.push(E.numSpotLights),g.push(E.numSpotLightMaps),g.push(E.numHemiLights),g.push(E.numRectAreaLights),g.push(E.numSunLightShadows),g.push(E.numDirLightShadows),g.push(E.numPointLightShadows),g.push(E.numSpotLightShadows),g.push(E.numSpotLightShadowsWithMaps),g.push(E.numLightProbes),g.push(E.numLightProbeGrids),g.push(E.shadowMapType),g.push(E.toneMapping),g.push(E.numClippingPlanes),g.push(E.numClipIntersection),g.push(E.depthPacking)}function f(g,E){a.disableAll(),E.instancing&&a.enable(0),E.instancingColor&&a.enable(1),E.instancingMorph&&a.enable(2),E.matcap&&a.enable(3),E.envMap&&a.enable(4),E.normalMapObjectSpace&&a.enable(5),E.normalMapTangentSpace&&a.enable(6),E.clearcoat&&a.enable(7),E.iridescence&&a.enable(8),E.alphaTest&&a.enable(9),E.vertexColors&&a.enable(10),E.vertexAlphas&&a.enable(11),E.vertexUv1s&&a.enable(12),E.vertexUv2s&&a.enable(13),E.vertexUv3s&&a.enable(14),E.vertexTangents&&a.enable(15),E.anisotropy&&a.enable(16),E.alphaHash&&a.enable(17),E.batching&&a.enable(18),E.dispersion&&a.enable(19),E.retroreflection&&a.enable(24),E.diffuseRoughness&&a.enable(25),E.batchingColor&&a.enable(20),E.gradientMap&&a.enable(21),E.packedNormalMap&&a.enable(22),E.vertexNormals&&a.enable(23),g.push(a.mask),a.disableAll(),E.fog&&a.enable(0),E.useFog&&a.enable(1),E.flatShading&&a.enable(2),E.logarithmicDepthBuffer&&a.enable(3),E.reversedDepthBuffer&&a.enable(4),E.skinning&&a.enable(5),E.morphTargets&&a.enable(6),E.morphNormals&&a.enable(7),E.morphColors&&a.enable(8),E.premultipliedAlpha&&a.enable(9),E.shadowMapEnabled&&a.enable(10),E.doubleSided&&a.enable(11),E.flipSided&&a.enable(12),E.useDepthPacking&&a.enable(13),E.dithering&&a.enable(14),E.transmission&&a.enable(15),E.sheen&&a.enable(16),E.opaque&&a.enable(17),E.pointsUvs&&a.enable(18),E.decodeVideoTexture&&a.enable(19),E.decodeVideoTextureEmissive&&a.enable(20),E.alphaToCoverage&&a.enable(21),E.numLightProbeGrids>0&&a.enable(22),E.hasPositionAttribute&&a.enable(23),g.push(a.mask)}function M(g){const E=h[g.type];let I;if(E){const R=Nn[E];I=Gh.clone(R.uniforms)}else I=g.uniforms;return I}function T(g,E){let I=u.get(E);return I!==void 0?++I.usedTimes:(I=new vg(i,E,g,s),c.push(I),u.set(E,I)),I}function S(g){if(--g.usedTimes===0){const E=c.indexOf(g);c[E]=c[c.length-1],c.pop(),u.delete(g.cacheKey),g.destroy()}}function b(g){o.remove(g)}function w(){o.dispose()}return{getParameters:_,getProgramCacheKey:v,getUniforms:M,acquireProgram:T,releaseProgram:S,releaseShaderCache:b,programs:c,dispose:w}}function bg(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,l){i.get(a)[o]=l}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function wg(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function oc(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function lc(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(h){let p=0;return h.isInstancedMesh&&(p+=2),h.isSkinnedMesh&&(p+=1),p}function o(h,p,_,v,m,f){let M=i[t];return M===void 0?(M={id:h.id,object:h,geometry:p,material:_,materialVariant:a(h),groupOrder:v,renderOrder:h.renderOrder,z:m,group:f},i[t]=M):(M.id=h.id,M.object=h,M.geometry=p,M.material=_,M.materialVariant=a(h),M.groupOrder=v,M.renderOrder=h.renderOrder,M.z=m,M.group=f),t++,M}function l(h,p,_,v,m,f,M){M.reversedDepth===!0&&(m=-m);const T=o(h,p,_,v,m,f);_.transmission>0?n.push(T):_.transparent===!0?s.push(T):e.push(T)}function c(h,p,_,v,m,f){const M=o(h,p,_,v,m,f);_.transmission>0?n.unshift(M):_.transparent===!0?s.unshift(M):e.unshift(M)}function u(h,p){e.length>1&&e.sort(h||wg),n.length>1&&n.sort(p||oc),s.length>1&&s.sort(p||oc)}function d(){for(let h=t,p=i.length;h<p;h++){const _=i[h];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:l,unshift:c,finish:d,sort:u}}function Ag(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new lc,i.set(n,[a])):s>=r.length?(a=new lc,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Rg(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new O,color:new Dt};break;case"SpotLight":e={position:new O,direction:new O,color:new Dt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new O,color:new Dt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new O,skyColor:new Dt,groundColor:new Dt};break;case"RectAreaLight":e={color:new Dt,position:new O,halfWidth:new O,halfHeight:new O};break}return i[t.id]=e,e}}}function Cg(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Gt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Gt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Gt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let Pg=0;function Lg(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function Dg(i){const t=new Rg,e=Cg(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);const s=new O,r=new ne,a=new ne;function o(c){let u=0,d=0,h=0;for(let D=0;D<9;D++)n.probe[D].set(0,0,0);let p=0,_=0,v=0,m=0,f=0,M=0,T=0,S=0,b=0,w=0,g=0,E=0,I=0,R=0;c.sort(Lg);for(let D=0,B=c.length;D<B;D++){const C=c[D],z=C.color,V=C.intensity,F=C.distance;let tt=null;if(C.shadow&&C.shadow.map&&(C.shadow.map.texture.format===wi?tt=C.shadow.map.texture:tt=C.shadow.map.depthTexture||C.shadow.map.texture),C.isAmbientLight)u+=z.r*V,d+=z.g*V,h+=z.b*V;else if(C.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(C.sh.coefficients[W],V);R++}else if(C.isSunLight){const W=t.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const J=C.shadow,j=e.get(C);j.shadowIntensity=J.intensity,j.shadowBias=J.bias,j.shadowNormalBias=J.normalBias,j.shadowRadius=J.radius,j.shadowMapSize.copy(J.mapSize).multiply(J.getFrameExtents()),n.sunShadow[_]=j,n.sunShadowMap[_]=tt;const ut=J.getViewportCount();for(let Rt=0;Rt<ut;Rt++)n.sunShadowMatrix[v+Rt]=J.getMatrix(Rt),n.sunShadowCascade[v+Rt]=J._cascadeData[Rt];v+=ut,_++}n.sun[p]=W,p++}else if(C.isDirectionalLight){const W=t.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),C.castShadow){const J=C.shadow,j=e.get(C);j.shadowIntensity=J.intensity,j.shadowBias=J.bias,j.shadowNormalBias=J.normalBias,j.shadowRadius=J.radius,j.shadowMapSize=J.mapSize,n.directionalShadow[m]=j,n.directionalShadowMap[m]=tt,n.directionalShadowMatrix[m]=C.shadow.matrix,b++}n.directional[m]=W,m++}else if(C.isSpotLight){const W=t.get(C);W.position.setFromMatrixPosition(C.matrixWorld),W.color.copy(z).multiplyScalar(V),W.distance=F,W.coneCos=Math.cos(C.angle),W.penumbraCos=Math.cos(C.angle*(1-C.penumbra)),W.decay=C.decay,n.spot[M]=W;const J=C.shadow;if(C.map&&(n.spotLightMap[E]=C.map,E++,J.updateMatrices(C),C.castShadow&&I++),n.spotLightMatrix[M]=J.matrix,C.castShadow){const j=e.get(C);j.shadowIntensity=J.intensity,j.shadowBias=J.bias,j.shadowNormalBias=J.normalBias,j.shadowRadius=J.radius,j.shadowMapSize=J.mapSize,n.spotShadow[M]=j,n.spotShadowMap[M]=tt,g++}M++}else if(C.isRectAreaLight){const W=t.get(C);W.color.copy(z).multiplyScalar(V),W.halfWidth.set(C.width*.5,0,0),W.halfHeight.set(0,C.height*.5,0),n.rectArea[T]=W,T++}else if(C.isPointLight){const W=t.get(C);if(W.color.copy(C.color).multiplyScalar(C.intensity),W.distance=C.distance,W.decay=C.decay,C.castShadow){const J=C.shadow,j=e.get(C);j.shadowIntensity=J.intensity,j.shadowBias=J.bias,j.shadowNormalBias=J.normalBias,j.shadowRadius=J.radius,j.shadowMapSize=J.mapSize,j.shadowCameraNear=J.camera.near,j.shadowCameraFar=J.camera.far,n.pointShadow[f]=j,n.pointShadowMap[f]=tt,n.pointShadowMatrix[f]=C.shadow.matrix,w++}n.point[f]=W,f++}else if(C.isHemisphereLight){const W=t.get(C);W.skyColor.copy(C.color).multiplyScalar(V),W.groundColor.copy(C.groundColor).multiplyScalar(V),n.hemi[S]=W,S++}}T>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=_t.LTC_FLOAT_1,n.rectAreaLTC2=_t.LTC_FLOAT_2):(n.rectAreaLTC1=_t.LTC_HALF_1,n.rectAreaLTC2=_t.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=d,n.ambient[2]=h;const L=n.hash;(L.sunLength!==p||L.directionalLength!==m||L.pointLength!==f||L.spotLength!==M||L.rectAreaLength!==T||L.hemiLength!==S||L.numSunShadows!==_||L.numDirectionalShadows!==b||L.numPointShadows!==w||L.numSpotShadows!==g||L.numSpotMaps!==E||L.numLightProbes!==R)&&(n.sun.length=p,n.directional.length=m,n.spot.length=M,n.rectArea.length=T,n.point.length=f,n.hemi.length=S,n.sunShadow.length=_,n.sunShadowMap.length=_,n.sunShadowMatrix.length=v,n.sunShadowCascade.length=v,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.directionalShadowMatrix.length=b,n.pointShadow.length=w,n.pointShadowMap.length=w,n.pointShadowMatrix.length=w,n.spotShadow.length=g,n.spotShadowMap.length=g,n.spotLightMatrix.length=g+E-I,n.spotLightMap.length=E,n.numSpotLightShadowsWithMaps=I,n.numLightProbes=R,L.sunLength=p,L.directionalLength=m,L.pointLength=f,L.spotLength=M,L.rectAreaLength=T,L.hemiLength=S,L.numSunShadows=_,L.numDirectionalShadows=b,L.numPointShadows=w,L.numSpotShadows=g,L.numSpotMaps=E,L.numLightProbes=R,n.version=Pg++)}function l(c,u){let d=0,h=0,p=0,_=0,v=0,m=0;const f=u.matrixWorldInverse;for(let M=0,T=c.length;M<T;M++){const S=c[M];if(S.isSunLight){const b=n.sun[d];b.direction.setFromMatrixPosition(S.matrixWorld),b.direction.transformDirection(f),d++}else if(S.isDirectionalLight){const b=n.directional[h];b.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(f),h++}else if(S.isSpotLight){const b=n.spot[_];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(f),b.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),b.direction.sub(s),b.direction.transformDirection(f),_++}else if(S.isRectAreaLight){const b=n.rectArea[v];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(f),a.identity(),r.copy(S.matrixWorld),r.premultiply(f),a.extractRotation(r),b.halfWidth.set(S.width*.5,0,0),b.halfHeight.set(0,S.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),v++}else if(S.isPointLight){const b=n.point[p];b.position.setFromMatrixPosition(S.matrixWorld),b.position.applyMatrix4(f),p++}else if(S.isHemisphereLight){const b=n.hemi[m];b.direction.setFromMatrixPosition(S.matrixWorld),b.direction.transformDirection(f),m++}}}return{setup:o,setupView:l,state:n}}function cc(i){const t=new Dg(i),e=[],n=[],s=[];function r(d){u.camera=d,e.length=0,n.length=0,s.length=0}function a(d){d.isLightProbeGrid?s.push(d):e.push(d)}function o(d){n.push(d)}function l(){t.setup(e),s.sort((d,h)=>d.priority-h.priority||d.id-h.id)}function c(d){t.setupView(e,d)}const u={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:u,setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function Ig(i){let t=new WeakMap;function e(s,r=0){const a=t.get(s);let o;return a===void 0?(o=new cc(i),t.set(s,[o])):r>=a.length?(o=new cc(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}const Ng=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ug=`uniform sampler2D shadow_pass;
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
}`,Fg=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],Og=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],uc=new ne,ps=new O,va=new O;function Bg(i,t,e){let n=new Rs;const s=new Gt,r=new Gt,a=new ge,o=new Wh,l=new Xh,c={},u=e.maxTextureSize,d={[ti]:je,[je]:ti,[_n]:_n},h=new Gn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Gt},radius:{value:4}},vertexShader:Ng,fragmentShader:Ug}),p=h.clone();p.defines.HORIZONTAL_PASS=1;const _=new tn;_.setAttribute("position",new Ue(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const v=new Xt(_,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=_s;let f=this.type;this.render=function(w,g,E){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||w.length===0)return;this.type===Lu&&(Nt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=_s);const I=i.getRenderTarget(),R=i.getActiveCubeFace(),L=i.getActiveMipmapLevel(),D=i.state;D.setBlending($i),D.buffers.depth.getReversed()===!0?D.buffers.color.setClear(0,0,0,0):D.buffers.color.setClear(1,1,1,1),D.buffers.depth.setTest(!0),D.setScissorTest(!1);const B=f!==this.type;B&&g.traverse(function(C){C.material&&(Array.isArray(C.material)?C.material.forEach(z=>z.needsUpdate=!0):C.material.needsUpdate=!0)});for(let C=0,z=w.length;C<z;C++){const V=w[C],F=V.shadow;if(F===void 0){Nt("WebGLShadowMap:",V,"has no shadow.");continue}if(F.autoUpdate===!1&&F.needsUpdate===!1)continue;s.copy(F.mapSize);const tt=F.getFrameExtents();s.multiply(tt),r.copy(F.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/tt.x),s.x=r.x*tt.x,F.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/tt.y),s.y=r.y*tt.y,F.mapSize.y=r.y));const W=i.state.buffers.depth.getReversed();if(F.camera._reversedDepth=W,F.map===null||B===!0){if(F.map!==null&&(F.map.depthTexture!==null&&(F.map.depthTexture.dispose(),F.map.depthTexture=null),F.map.dispose()),this.type===ms){if(V.isPointLight){Nt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}F.map=new Rn(s.x,s.y,{format:wi,type:zn,minFilter:Qe,magFilter:Qe,generateMipmaps:!1}),F.map.texture.name=V.name+".shadowMap",F.map.depthTexture=new es(s.x,s.y,bn),F.map.depthTexture.name=V.name+".shadowMapDepth",F.map.depthTexture.format=gi,F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=ye,F.map.depthTexture.magFilter=ye}else V.isPointLight?(F.map=new Oo(s.x),F.map.depthTexture=new Kc(s.x,Bn)):(F.map=new Rn(s.x,s.y),F.map.depthTexture=new es(s.x,s.y,Bn)),F.map.depthTexture.name=V.name+".shadowMap",F.map.depthTexture.format=gi,this.type===_s?(F.map.depthTexture.compareFunction=W?Bc:Oc,F.map.depthTexture.minFilter=Qe,F.map.depthTexture.magFilter=Qe):(F.map.depthTexture.compareFunction=null,F.map.depthTexture.minFilter=ye,F.map.depthTexture.magFilter=ye);F.camera.updateProjectionMatrix()}F.map.isWebGLCubeRenderTarget!==!0&&(F.map.width!==s.x||F.map.height!==s.y)&&F.map.setSize(s.x,s.y);const J=F.map.isWebGLCubeRenderTarget?6:F.getViewportCount();V.isPointLight!==!0&&F.updateMatrices(V,E);const j=(F.camera.layers.mask&4294967294)!==0?F.camera.layers:E.layers;for(let ut=0;ut<J;ut++){const Rt=F.getCamera(ut);if(V.isPointLight){const q=F.camera,pt=F.matrix,St=V.distance||q.far;St!==q.far&&(q.far=St,q.updateProjectionMatrix()),ps.setFromMatrixPosition(V.matrixWorld),q.position.copy(ps),va.copy(q.position),va.add(Fg[ut]),q.up.copy(Og[ut]),q.lookAt(va),q.updateMatrixWorld(),pt.makeTranslation(-ps.x,-ps.y,-ps.z),uc.multiplyMatrices(q.projectionMatrix,q.matrixWorldInverse),F._frustum.setFromProjectionMatrix(uc,q.coordinateSystem,q.reversedDepth)}if(F.map.isWebGLCubeRenderTarget)i.setRenderTarget(F.map,ut),i.clear();else{ut===0&&(i.setRenderTarget(F.map),i.clear());const q=F.getViewport(ut);a.set(r.x*q.x,r.y*q.y,r.x*q.z,r.y*q.w),D.viewport(a)}n=F.getFrustum(ut),S(g,E,Rt,V,j,this.type)}F.isPointLightShadow!==!0&&this.type===ms&&M(F,E),F.needsUpdate=!1}f=this.type,m.needsUpdate=!1,i.setRenderTarget(I,R,L)};function M(w,g){const E=t.update(v);h.defines.VSM_SAMPLES!==w.blurSamples&&(h.defines.VSM_SAMPLES=w.blurSamples,p.defines.VSM_SAMPLES=w.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),w.mapPass===null?w.mapPass=new Rn(s.x,s.y,{format:wi,type:zn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),h.uniforms.shadow_pass.value=w.map.depthTexture,h.uniforms.resolution.value.set(w.map.width,w.map.height),h.uniforms.radius.value=w.radius,i.setRenderTarget(w.mapPass),i.clear(),i.renderBufferDirect(g,null,E,h,v,null),p.uniforms.shadow_pass.value=w.mapPass.texture,p.uniforms.resolution.value.set(w.map.width,w.map.height),p.uniforms.radius.value=w.radius,i.setRenderTarget(w.map),i.clear(),i.renderBufferDirect(g,null,E,p,v,null)}function T(w,g,E,I){let R=null;const L=E.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(L!==void 0)R=L;else if(R=E.isPointLight===!0?l:o,i.localClippingEnabled&&g.clipShadows===!0&&Array.isArray(g.clippingPlanes)&&g.clippingPlanes.length!==0||g.displacementMap&&g.displacementScale!==0||g.alphaMap&&g.alphaTest>0||g.map&&g.alphaTest>0||g.alphaToCoverage===!0){const D=R.uuid,B=g.uuid;let C=c[D];C===void 0&&(C={},c[D]=C);let z=C[B];z===void 0&&(z=R.clone(),C[B]=z,g.addEventListener("dispose",b)),R=z}if(R.visible=g.visible,R.wireframe=g.wireframe,I===ms?R.side=g.shadowSide!==null?g.shadowSide:g.side:R.side=g.shadowSide!==null?g.shadowSide:d[g.side],R.alphaMap=g.alphaMap,R.alphaTest=g.alphaToCoverage===!0?.5:g.alphaTest,R.map=g.map,R.clipShadows=g.clipShadows,R.clippingPlanes=g.clippingPlanes,R.clipIntersection=g.clipIntersection,R.displacementMap=g.displacementMap,R.displacementScale=g.displacementScale,R.displacementBias=g.displacementBias,R.wireframeLinewidth=g.wireframeLinewidth,R.linewidth=g.linewidth,E.isPointLight===!0&&R.isMeshDistanceMaterial===!0){const D=i.properties.get(R);D.light=E}return R}function S(w,g,E,I,R,L){if(w.visible===!1)return;if(w.layers.test(R)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&L===ms)&&(!w.frustumCulled||w.intersectsFrustum(n))){w.modelViewMatrix.multiplyMatrices(E.matrixWorldInverse,w.matrixWorld);const C=t.update(w),z=w.material;if(Array.isArray(z)){const V=C.groups;for(let F=0,tt=V.length;F<tt;F++){const W=V[F],J=z[W.materialIndex];if(J&&J.visible){const j=T(w,J,I,L);w.onBeforeShadow(i,w,g,E,C,j,W),i.renderBufferDirect(E,null,C,j,w,W),w.onAfterShadow(i,w,g,E,C,j,W)}}}else if(z.visible){const V=T(w,z,I,L);w.onBeforeShadow(i,w,g,E,C,V,null),i.renderBufferDirect(E,null,C,V,w,null),w.onAfterShadow(i,w,g,E,C,V,null)}}const B=w.children;for(let C=0,z=B.length;C<z;C++)S(B[C],g,E,I,R,L)}function b(w){w.target.removeEventListener("dispose",b);for(const E in c){const I=c[E],R=w.target.uuid;R in I&&(I[R].dispose(),delete I[R])}}}function zg(i,t){function e(){let P=!1;const Z=new ge;let Y=null;const lt=new ge(0,0,0,0);return{setMask:function(st){Y!==st&&!P&&(i.colorMask(st,st,st,st),Y=st)},setLocked:function(st){P=st},setClear:function(st,at,At,Vt,nt){nt===!0&&(st*=Vt,at*=Vt,At*=Vt),Z.set(st,at,At,Vt),lt.equals(Z)===!1&&(i.clearColor(st,at,At,Vt),lt.copy(Z))},reset:function(){P=!1,Y=null,lt.set(-1,0,0,0)}}}function n(){let P=!1,Z=!1,Y=null,lt=null,st=null;return{setReversed:function(at){if(Z!==at){const At=t.get("EXT_clip_control");at?At.clipControlEXT(At.LOWER_LEFT_EXT,At.ZERO_TO_ONE_EXT):At.clipControlEXT(At.LOWER_LEFT_EXT,At.NEGATIVE_ONE_TO_ONE_EXT),Z=at;const Vt=st;st=null,this.setClear(Vt)}},getReversed:function(){return Z},setTest:function(at){at?ft(i.DEPTH_TEST):zt(i.DEPTH_TEST)},setMask:function(at){Y!==at&&!P&&(i.depthMask(at),Y=at)},setFunc:function(at){if(Z&&(at=hh[at]),lt!==at){switch(at){case ya:i.depthFunc(i.NEVER);break;case Ea:i.depthFunc(i.ALWAYS);break;case Ta:i.depthFunc(i.LESS);break;case ys:i.depthFunc(i.LEQUAL);break;case ba:i.depthFunc(i.EQUAL);break;case wa:i.depthFunc(i.GEQUAL);break;case Aa:i.depthFunc(i.GREATER);break;case Ra:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}lt=at}},setLocked:function(at){P=at},setClear:function(at){st!==at&&(st=at,Z&&(at=1-at),i.clearDepth(at))},reset:function(){P=!1,Y=null,lt=null,st=null,Z=!1}}}function s(){let P=!1,Z=null,Y=null,lt=null,st=null,at=null,At=null,Vt=null,nt=null;return{setTest:function(Pt){P||(Pt?ft(i.STENCIL_TEST):zt(i.STENCIL_TEST))},setMask:function(Pt){Z!==Pt&&!P&&(i.stencilMask(Pt),Z=Pt)},setFunc:function(Pt,Ht,gt){(Y!==Pt||lt!==Ht||st!==gt)&&(i.stencilFunc(Pt,Ht,gt),Y=Pt,lt=Ht,st=gt)},setOp:function(Pt,Ht,gt){(at!==Pt||At!==Ht||Vt!==gt)&&(i.stencilOp(Pt,Ht,gt),at=Pt,At=Ht,Vt=gt)},setLocked:function(Pt){P=Pt},setClear:function(Pt){nt!==Pt&&(i.clearStencil(Pt),nt=Pt)},reset:function(){P=!1,Z=null,Y=null,lt=null,st=null,at=null,At=null,Vt=null,nt=null}}}const r=new e,a=new n,o=new s;let l={};const c=new WeakMap;let u={},d={},h={},p=new WeakMap,_=[],v=null,m=!1,f=null,M=null,T=null,S=null,b=null,w=null,g=null,E=new Dt(0,0,0),I=0,R=!1,L=null,D=null,B=null,C=null,z=null;const V=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let F=!1,tt=0;const W=i.getParameter(i.VERSION);W.indexOf("WebGL")!==-1?(tt=parseFloat(/^WebGL (\d)/.exec(W)[1]),F=tt>=1):W.indexOf("OpenGL ES")!==-1&&(tt=parseFloat(/^OpenGL ES (\d)/.exec(W)[1]),F=tt>=2);let J=null,j={};const ut=i.getParameter(i.SCISSOR_BOX),Rt=i.getParameter(i.VIEWPORT),q=new ge().fromArray(ut),pt=new ge().fromArray(Rt);function St(P,Z,Y,lt){const st=new Uint8Array(4),at=i.createTexture();i.bindTexture(P,at),i.texParameteri(P,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(P,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let At=0;At<Y;At++)P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY?i.texImage3D(Z,0,i.RGBA,1,1,lt,0,i.RGBA,i.UNSIGNED_BYTE,st):i.texImage2D(Z+At,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,st);return at}const Ct={};Ct[i.TEXTURE_2D]=St(i.TEXTURE_2D,i.TEXTURE_2D,1),Ct[i.TEXTURE_CUBE_MAP]=St(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Ct[i.TEXTURE_2D_ARRAY]=St(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Ct[i.TEXTURE_3D]=St(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),ft(i.DEPTH_TEST),a.setFunc(ys),en(!1),fe(ll),ft(i.CULL_FACE),Be($i);function ft(P){u[P]!==!0&&(i.enable(P),u[P]=!0)}function zt(P){u[P]!==!1&&(i.disable(P),u[P]=!1)}function ve(P,Z){return h[P]!==Z?(i.bindFramebuffer(P,Z),h[P]=Z,P===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=Z),P===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=Z),!0):!1}function It(P,Z){let Y=_,lt=!1;if(P){Y=p.get(Z),Y===void 0&&(Y=[],p.set(Z,Y));const st=P.textures;if(Y.length!==st.length||Y[0]!==i.COLOR_ATTACHMENT0){for(let at=0,At=st.length;at<At;at++)Y[at]=i.COLOR_ATTACHMENT0+at;Y.length=st.length,lt=!0}}else Y[0]!==i.BACK&&(Y[0]=i.BACK,lt=!0);lt&&i.drawBuffers(Y)}function ie(P){return v!==P?(i.useProgram(P),v=P,!0):!1}const oe={[qi]:i.FUNC_ADD,[Iu]:i.FUNC_SUBTRACT,[Nu]:i.FUNC_REVERSE_SUBTRACT};oe[Uu]=i.MIN,oe[Fu]=i.MAX;const $t={[Ou]:i.ZERO,[Bu]:i.ONE,[zu]:i.SRC_COLOR,[Sc]:i.SRC_ALPHA,[Xu]:i.SRC_ALPHA_SATURATE,[Vu]:i.DST_COLOR,[Hu]:i.DST_ALPHA,[Gu]:i.ONE_MINUS_SRC_COLOR,[yc]:i.ONE_MINUS_SRC_ALPHA,[Wu]:i.ONE_MINUS_DST_COLOR,[ku]:i.ONE_MINUS_DST_ALPHA,[qu]:i.CONSTANT_COLOR,[Yu]:i.ONE_MINUS_CONSTANT_COLOR,[$u]:i.CONSTANT_ALPHA,[Ku]:i.ONE_MINUS_CONSTANT_ALPHA};function Be(P,Z,Y,lt,st,at,At,Vt,nt,Pt){if(P===$i){m===!0&&(zt(i.BLEND),m=!1);return}if(m===!1&&(ft(i.BLEND),m=!0),P!==Du){if(P!==f||Pt!==R){if((M!==qi||b!==qi)&&(i.blendEquation(i.FUNC_ADD),M=qi,b=qi),Pt)switch(P){case xs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case cl:i.blendFunc(i.ONE,i.ONE);break;case ul:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case hl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:te("WebGLState: Invalid blending: ",P);break}else switch(P){case xs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case cl:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case ul:te("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case hl:te("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:te("WebGLState: Invalid blending: ",P);break}T=null,S=null,w=null,g=null,E.set(0,0,0),I=0,f=P,R=Pt}return}st=st||Z,at=at||Y,At=At||lt,(Z!==M||st!==b)&&(i.blendEquationSeparate(oe[Z],oe[st]),M=Z,b=st),(Y!==T||lt!==S||at!==w||At!==g)&&(i.blendFuncSeparate($t[Y],$t[lt],$t[at],$t[At]),T=Y,S=lt,w=at,g=At),(Vt.equals(E)===!1||nt!==I)&&(i.blendColor(Vt.r,Vt.g,Vt.b,nt),E.copy(Vt),I=nt),f=P,R=!1}function Ee(P,Z){P.side===_n?zt(i.CULL_FACE):ft(i.CULL_FACE);let Y=P.side===je;Z&&(Y=!Y),en(Y),P.blending===xs&&P.transparent===!1?Be($i):Be(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),r.setMask(P.colorWrite);const lt=P.stencilWrite;o.setTest(lt),lt&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),Re(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?ft(i.SAMPLE_ALPHA_TO_COVERAGE):zt(i.SAMPLE_ALPHA_TO_COVERAGE)}function en(P){L!==P&&(P?i.frontFace(i.CW):i.frontFace(i.CCW),L=P)}function fe(P){P!==Cu?(ft(i.CULL_FACE),P!==D&&(P===ll?i.cullFace(i.BACK):P===Pu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):zt(i.CULL_FACE),D=P}function Pn(P){P!==B&&(F&&i.lineWidth(P),B=P)}function Re(P,Z,Y){P?(ft(i.POLYGON_OFFSET_FILL),(C!==Z||z!==Y)&&(C=Z,z=Y,a.getReversed()&&(Z=-Z,Y=-Y),i.polygonOffset(Z,Y))):zt(i.POLYGON_OFFSET_FILL)}function hn(P){P?ft(i.SCISSOR_TEST):zt(i.SCISSOR_TEST)}function dn(P){P===void 0&&(P=i.TEXTURE0+V-1),J!==P&&(i.activeTexture(P),J=P)}function fn(P,Z,Y){Y===void 0&&(J===null?Y=i.TEXTURE0+V-1:Y=J);let lt=j[Y];lt===void 0&&(lt={type:void 0,texture:void 0},j[Y]=lt),(lt.type!==P||lt.texture!==Z)&&(J!==Y&&(i.activeTexture(Y),J=Y),i.bindTexture(P,Z||Ct[P]),lt.type=P,lt.texture=Z)}function U(){const P=j[J];P!==void 0&&P.type!==void 0&&(i.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function pn(){try{i.compressedTexImage2D(...arguments)}catch(P){te("WebGLState:",P)}}function ue(){try{i.compressedTexImage3D(...arguments)}catch(P){te("WebGLState:",P)}}function he(){try{i.texSubImage2D(...arguments)}catch(P){te("WebGLState:",P)}}function mt(){try{i.texSubImage3D(...arguments)}catch(P){te("WebGLState:",P)}}function Te(){try{i.compressedTexSubImage2D(...arguments)}catch(P){te("WebGLState:",P)}}function Lt(){try{i.compressedTexSubImage3D(...arguments)}catch(P){te("WebGLState:",P)}}function Ut(){try{i.texStorage2D(...arguments)}catch(P){te("WebGLState:",P)}}function A(){try{i.texStorage3D(...arguments)}catch(P){te("WebGLState:",P)}}function x(){try{i.texImage2D(...arguments)}catch(P){te("WebGLState:",P)}}function H(){try{i.texImage3D(...arguments)}catch(P){te("WebGLState:",P)}}function et(P){return d[P]!==void 0?d[P]:i.getParameter(P)}function Q(P,Z){d[P]!==Z&&(i.pixelStorei(P,Z),d[P]=Z)}function rt(P){q.equals(P)===!1&&(i.scissor(P.x,P.y,P.z,P.w),q.copy(P))}function ht(P){pt.equals(P)===!1&&(i.viewport(P.x,P.y,P.z,P.w),pt.copy(P))}function $(P,Z){let Y=c.get(Z);Y===void 0&&(Y=new WeakMap,c.set(Z,Y));let lt=Y.get(P);lt===void 0&&(lt=i.getUniformBlockIndex(Z,P.name),i.uniformBlockBinding(Z,lt,lt),Y.set(P,lt))}function K(P,Z,Y){const st=c.get(Z).get(P);l[st]!==Y&&(i.bindBufferBase(i.UNIFORM_BUFFER,st,Y),l[st]=Y)}function ot(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},d={},J=null,j={},h={},l={},p=new WeakMap,_=[],v=null,m=!1,f=null,M=null,T=null,S=null,b=null,w=null,g=null,E=new Dt(0,0,0),I=0,R=!1,L=null,D=null,B=null,C=null,z=null,q.set(0,0,i.canvas.width,i.canvas.height),pt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:ft,disable:zt,bindFramebuffer:ve,drawBuffers:It,useProgram:ie,setBlending:Be,setMaterial:Ee,setFlipSided:en,setCullFace:fe,setLineWidth:Pn,setPolygonOffset:Re,setScissorTest:hn,activeTexture:dn,bindTexture:fn,unbindTexture:U,compressedTexImage2D:pn,compressedTexImage3D:ue,texImage2D:x,texImage3D:H,pixelStorei:Q,getParameter:et,updateUBOMapping:$,uniformBlockBinding:K,texStorage2D:Ut,texStorage3D:A,texSubImage2D:he,texSubImage3D:mt,compressedTexSubImage2D:Te,compressedTexSubImage3D:Lt,scissor:rt,viewport:ht,reset:ot}}function Gg(i,t,e,n,s,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Gt,u=new WeakMap,d=new Set;let h;const p=new WeakMap,_=new Set,v=new FinalizationRegistry(A=>_.delete(A));let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function f(A,x){return m?new OffscreenCanvas(A,x):As("canvas")}function M(A,x,H){let et=1;const Q=Ut(A);if((Q.width>H||Q.height>H)&&(et=H/Math.max(Q.width,Q.height)),et<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){const rt=Math.floor(et*Q.width),ht=Math.floor(et*Q.height);h===void 0&&(h=f(rt,ht));const $=x?f(rt,ht):h;return $.width=rt,$.height=ht,$.getContext("2d").drawImage(A,0,0,rt,ht),Nt("WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+rt+"x"+ht+")."),$}else return"data"in A&&Nt("WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),A;return A}function T(A){return A.generateMipmaps}function S(A){i.generateMipmap(A)}function b(A){return A.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?i.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function w(A,x,H,et,Q,rt=!1){if(A!==null){if(i[A]!==void 0)return i[A];Nt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let ht;et&&(ht=t.get("EXT_texture_norm16"),ht||Nt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=x;if(x===i.RED&&(H===i.FLOAT&&($=i.R32F),H===i.HALF_FLOAT&&($=i.R16F),H===i.UNSIGNED_BYTE&&($=i.R8),H===i.UNSIGNED_SHORT&&ht&&($=ht.R16_EXT),H===i.SHORT&&ht&&($=ht.R16_SNORM_EXT)),x===i.RED_INTEGER&&(H===i.UNSIGNED_BYTE&&($=i.R8UI),H===i.UNSIGNED_SHORT&&($=i.R16UI),H===i.UNSIGNED_INT&&($=i.R32UI),H===i.BYTE&&($=i.R8I),H===i.SHORT&&($=i.R16I),H===i.INT&&($=i.R32I)),x===i.RG&&(H===i.FLOAT&&($=i.RG32F),H===i.HALF_FLOAT&&($=i.RG16F),H===i.UNSIGNED_BYTE&&($=i.RG8),H===i.UNSIGNED_SHORT&&ht&&($=ht.RG16_EXT),H===i.SHORT&&ht&&($=ht.RG16_SNORM_EXT)),x===i.RG_INTEGER&&(H===i.UNSIGNED_BYTE&&($=i.RG8UI),H===i.UNSIGNED_SHORT&&($=i.RG16UI),H===i.UNSIGNED_INT&&($=i.RG32UI),H===i.BYTE&&($=i.RG8I),H===i.SHORT&&($=i.RG16I),H===i.INT&&($=i.RG32I)),x===i.RGB_INTEGER&&(H===i.UNSIGNED_BYTE&&($=i.RGB8UI),H===i.UNSIGNED_SHORT&&($=i.RGB16UI),H===i.UNSIGNED_INT&&($=i.RGB32UI),H===i.BYTE&&($=i.RGB8I),H===i.SHORT&&($=i.RGB16I),H===i.INT&&($=i.RGB32I)),x===i.RGBA_INTEGER&&(H===i.UNSIGNED_BYTE&&($=i.RGBA8UI),H===i.UNSIGNED_SHORT&&($=i.RGBA16UI),H===i.UNSIGNED_INT&&($=i.RGBA32UI),H===i.BYTE&&($=i.RGBA8I),H===i.SHORT&&($=i.RGBA16I),H===i.INT&&($=i.RGBA32I)),x===i.RGB&&(H===i.UNSIGNED_SHORT&&ht&&($=ht.RGB16_EXT),H===i.SHORT&&ht&&($=ht.RGB16_SNORM_EXT),H===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),H===i.UNSIGNED_INT_10F_11F_11F_REV&&($=i.R11F_G11F_B10F)),x===i.RGBA){const K=rt?Tr:Jt.getTransfer(Q);H===i.FLOAT&&($=i.RGBA32F),H===i.HALF_FLOAT&&($=i.RGBA16F),H===i.UNSIGNED_BYTE&&($=K===re?i.SRGB8_ALPHA8:i.RGBA8),H===i.UNSIGNED_SHORT&&ht&&($=ht.RGBA16_EXT),H===i.SHORT&&ht&&($=ht.RGBA16_SNORM_EXT),H===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),H===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&t.get("EXT_color_buffer_float"),$}function g(A,x){let H;return A?x===null||x===Bn||x===ts?H=i.DEPTH24_STENCIL8:x===bn?H=i.DEPTH32F_STENCIL8:x===Ts&&(H=i.DEPTH24_STENCIL8,Nt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Bn||x===ts?H=i.DEPTH_COMPONENT24:x===bn?H=i.DEPTH_COMPONENT32F:x===Ts&&(H=i.DEPTH_COMPONENT16),H}function E(A,x){return T(A)===!0||A.isFramebufferTexture&&A.minFilter!==ye&&A.minFilter!==Qe?Math.log2(Math.max(x.width,x.height))+1:A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?x.mipmaps.length:1}function I(A){const x=new WeakRef(A);n.get(A).__ref=x,_.add(x),v.register(A,x,x)}function R(A){const x=n.get(A).__ref;x!==void 0&&(_.delete(x),v.unregister(x))}function L(A){B(A.target)}function D(A){C(A.target)}function B(A){A.removeEventListener("dispose",L),R(A),V(A),A.isVideoTexture&&u.delete(A),A.isHTMLTexture&&d.delete(A)}function C(A){A.removeEventListener("dispose",D),R(A),tt(A)}function z(){for(const A of _){const x=A.deref();x!==void 0&&(x.isRenderTarget===!0?C(x):B(x))}_.clear(),d.clear()}function V(A){const x=n.get(A);if(x.__webglInit===void 0)return;const H=A.source,et=p.get(H);if(et){const Q=et[x.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&F(A),Object.keys(et).length===0&&p.delete(H)}n.remove(A)}function F(A){const x=n.get(A);i.deleteTexture(x.__webglTexture);const H=A.source,et=p.get(H);delete et[x.__cacheKey],a.memory.textures--}function tt(A){const x=n.get(A);x.__depthDisposeCallback&&x.__depthDisposeCallback();const H=A.depthTexture;if(H&&H.renderTarget===A&&B(H),A.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(x.__webglFramebuffer[Q]))for(let rt=0;rt<x.__webglFramebuffer[Q].length;rt++)i.deleteFramebuffer(x.__webglFramebuffer[Q][rt]);else i.deleteFramebuffer(x.__webglFramebuffer[Q]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[Q])}else{if(Array.isArray(x.__webglFramebuffer))for(let Q=0;Q<x.__webglFramebuffer.length;Q++)i.deleteFramebuffer(x.__webglFramebuffer[Q]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let Q=0;Q<x.__webglColorRenderbuffer.length;Q++)x.__webglColorRenderbuffer[Q]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[Q]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const et=A.textures;for(let Q=0,rt=et.length;Q<rt;Q++){const ht=n.get(et[Q]);ht.__webglTexture&&(i.deleteTexture(ht.__webglTexture),a.memory.textures--),n.remove(et[Q])}n.remove(A)}let W=0;function J(){W=0}function j(){return W}function ut(A){W=A}function Rt(){const A=W;return A>=s.maxTextures&&Nt("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+s.maxTextures),W+=1,A}function q(A){const x=[];return x.push(A.wrapS),x.push(A.wrapT),x.push(A.wrapR||0),x.push(A.magFilter),x.push(A.minFilter),x.push(A.anisotropy),x.push(A.internalFormat),x.push(A.format),x.push(A.type),x.push(A.generateMipmaps),x.push(A.mipmapsAutoUpdate),x.push(A.premultiplyAlpha),x.push(A.flipY),x.push(A.unpackAlignment),x.push(A.colorSpace),x.join()}function pt(A,x){const H=n.get(A);if(A.isVideoTexture&&Te(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&H.__version!==A.version){const et=A.image;if(et===null)Nt("WebGLRenderer: Texture marked for update but no image data found.");else if(et.complete===!1)Nt("WebGLRenderer: Texture marked for update but image is incomplete");else{Ee(H,A,x);return}}else A.isExternalTexture&&(H.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,H.__webglTexture,i.TEXTURE0+x)}function St(A,x){const H=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&H.__version!==A.version){Ee(H,A,x);return}else A.isExternalTexture&&(H.__webglTexture=A.sourceTexture?A.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,H.__webglTexture,i.TEXTURE0+x)}function Ct(A,x){const H=n.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&H.__version!==A.version){Ee(H,A,x);return}e.bindTexture(i.TEXTURE_3D,H.__webglTexture,i.TEXTURE0+x)}function ft(A,x){const H=n.get(A);if(A.version>0&&H.__version!==A.version){en(H,A,x);return}e.bindTexture(i.TEXTURE_CUBE_MAP,H.__webglTexture,i.TEXTURE0+x)}const zt={[Ca]:i.REPEAT,[Kn]:i.CLAMP_TO_EDGE,[Pa]:i.MIRRORED_REPEAT},ve={[ye]:i.NEAREST,[Qu]:i.NEAREST_MIPMAP_NEAREST,[Os]:i.NEAREST_MIPMAP_LINEAR,[Qe]:i.LINEAR,[qr]:i.LINEAR_MIPMAP_NEAREST,[Zn]:i.LINEAR_MIPMAP_LINEAR},It={[nh]:i.NEVER,[zc]:i.ALWAYS,[ih]:i.LESS,[Oc]:i.LEQUAL,[sh]:i.EQUAL,[Bc]:i.GEQUAL,[rh]:i.GREATER,[ah]:i.NOTEQUAL};function ie(A,x){if(x.type===bn&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===Qe||x.magFilter===qr||x.magFilter===Os||x.magFilter===Zn||x.minFilter===Qe||x.minFilter===qr||x.minFilter===Os||x.minFilter===Zn)&&Nt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(A,i.TEXTURE_WRAP_S,zt[x.wrapS]),i.texParameteri(A,i.TEXTURE_WRAP_T,zt[x.wrapT]),(A===i.TEXTURE_3D||A===i.TEXTURE_2D_ARRAY)&&i.texParameteri(A,i.TEXTURE_WRAP_R,zt[x.wrapR]),i.texParameteri(A,i.TEXTURE_MAG_FILTER,ve[x.magFilter]),i.texParameteri(A,i.TEXTURE_MIN_FILTER,ve[x.minFilter]),x.compareFunction&&(i.texParameteri(A,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(A,i.TEXTURE_COMPARE_FUNC,It[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===ye||x.minFilter!==Os&&x.minFilter!==Zn||x.type===bn&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const H=t.get("EXT_texture_filter_anisotropic");i.texParameterf(A,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function oe(A,x){let H=!1;A.__webglInit===void 0&&(A.__webglInit=!0,x.addEventListener("dispose",L),I(x));const et=x.source;let Q=p.get(et);Q===void 0&&(Q={},p.set(et,Q));const rt=q(x);if(rt!==A.__cacheKey){Q[rt]===void 0&&(Q[rt]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,H=!0),Q[rt].usedTimes++;const ht=Q[A.__cacheKey];ht!==void 0&&(Q[A.__cacheKey].usedTimes--,ht.usedTimes===0&&F(x)),A.__cacheKey=rt,A.__webglTexture=Q[rt].texture}return H}function $t(A,x,H){return Math.floor(Math.floor(A/H)/x)}function Be(A,x,H,et){const rt=A.updateRanges;if(rt.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,x.width,x.height,H,et,x.data);else{rt.sort((P,Z)=>P.start-Z.start);let ht=0;for(let P=1;P<rt.length;P++){const Z=rt[ht],Y=rt[P],lt=Z.start+Z.count,st=$t(Y.start,x.width,4),at=$t(Z.start,x.width,4);Y.start<=lt+1&&st===at&&$t(Y.start+Y.count-1,x.width,4)===st?Z.count=Math.max(Z.count,Y.start+Y.count-Z.start):(++ht,rt[ht]=Y)}rt.length=ht+1;const $=e.getParameter(i.UNPACK_ROW_LENGTH),K=e.getParameter(i.UNPACK_SKIP_PIXELS),ot=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,x.width);for(let P=0,Z=rt.length;P<Z;P++){const Y=rt[P],lt=Math.floor(Y.start/4),st=Math.ceil(Y.count/4),at=lt%x.width,At=Math.floor(lt/x.width),Vt=st,nt=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,at),e.pixelStorei(i.UNPACK_SKIP_ROWS,At),e.texSubImage2D(i.TEXTURE_2D,0,at,At,Vt,nt,H,et,x.data)}A.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,$),e.pixelStorei(i.UNPACK_SKIP_PIXELS,K),e.pixelStorei(i.UNPACK_SKIP_ROWS,ot)}}function Ee(A,x,H){let et=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(et=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(et=i.TEXTURE_3D);const Q=oe(A,x),rt=x.source;e.bindTexture(et,A.__webglTexture,i.TEXTURE0+H);const ht=n.get(rt);if(rt.version!==ht.__version||Q===!0){if(e.activeTexture(i.TEXTURE0+H),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){const nt=Jt.getPrimaries(Jt.workingColorSpace),Pt=x.colorSpace===hi?null:Jt.getPrimaries(x.colorSpace),Ht=x.colorSpace===hi||nt===Pt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ht)}e.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment);let K=M(x.image,!1,s.maxTextureSize);K=Lt(x,K);const ot=r.convert(x.format,x.colorSpace),P=r.convert(x.type);let Z=w(x.internalFormat,ot,P,x.normalized,x.colorSpace,x.isVideoTexture);ie(et,x);let Y;const lt=x.mipmaps,st=x.isVideoTexture!==!0,at=ht.__version===void 0||Q===!0,At=rt.dataReady,Vt=E(x,K);if(x.isDepthTexture)Z=g(x.format===pi,x.type),at&&(st?e.texStorage2D(i.TEXTURE_2D,1,Z,K.width,K.height):e.texImage2D(i.TEXTURE_2D,0,Z,K.width,K.height,0,ot,P,null));else if(x.isDataTexture)if(lt.length>0){st&&at&&e.texStorage2D(i.TEXTURE_2D,Vt,Z,lt[0].width,lt[0].height);for(let nt=0,Pt=lt.length;nt<Pt;nt++)Y=lt[nt],st?At&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,Y.width,Y.height,ot,P,Y.data):e.texImage2D(i.TEXTURE_2D,nt,Z,Y.width,Y.height,0,ot,P,Y.data);x.generateMipmaps=!1}else st?(at&&e.texStorage2D(i.TEXTURE_2D,Vt,Z,K.width,K.height),At&&Be(x,K,ot,P)):e.texImage2D(i.TEXTURE_2D,0,Z,K.width,K.height,0,ot,P,K.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){st&&at&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Vt,Z,lt[0].width,lt[0].height,K.depth);for(let nt=0,Pt=lt.length;nt<Pt;nt++)if(Y=lt[nt],x.format!==Un)if(ot!==null)if(st){if(At)if(x.layerUpdates.size>0){const Ht=Vl(Y.width,Y.height,x.format,x.type);for(const gt of x.layerUpdates){const se=Y.data.subarray(gt*Ht/Y.data.BYTES_PER_ELEMENT,(gt+1)*Ht/Y.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,gt,Y.width,Y.height,1,ot,se)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,Y.width,Y.height,K.depth,ot,Y.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,nt,Z,Y.width,Y.height,K.depth,0,Y.data,0,0);else Nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else st?At&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,nt,0,0,0,Y.width,Y.height,K.depth,ot,P,Y.data):e.texImage3D(i.TEXTURE_2D_ARRAY,nt,Z,Y.width,Y.height,K.depth,0,ot,P,Y.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{st&&at&&e.texStorage2D(i.TEXTURE_2D,Vt,Z,lt[0].width,lt[0].height);for(let nt=0,Pt=lt.length;nt<Pt;nt++)Y=lt[nt],x.format!==Un?ot!==null?st?At&&e.compressedTexSubImage2D(i.TEXTURE_2D,nt,0,0,Y.width,Y.height,ot,Y.data):e.compressedTexImage2D(i.TEXTURE_2D,nt,Z,Y.width,Y.height,0,Y.data):Nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):st?At&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,Y.width,Y.height,ot,P,Y.data):e.texImage2D(i.TEXTURE_2D,nt,Z,Y.width,Y.height,0,ot,P,Y.data)}else if(x.isDataArrayTexture)if(st){if(at&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Vt,Z,K.width,K.height,K.depth),At)if(x.layerUpdates.size>0){const nt=Vl(K.width,K.height,x.format,x.type);for(const Pt of x.layerUpdates){const Ht=K.data.subarray(Pt*nt/K.data.BYTES_PER_ELEMENT,(Pt+1)*nt/K.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Pt,K.width,K.height,1,ot,P,Ht)}x.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,K.width,K.height,K.depth,ot,P,K.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,Z,K.width,K.height,K.depth,0,ot,P,K.data);else if(x.isData3DTexture)st?(at&&e.texStorage3D(i.TEXTURE_3D,Vt,Z,K.width,K.height,K.depth),At&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,K.width,K.height,K.depth,ot,P,K.data)):e.texImage3D(i.TEXTURE_3D,0,Z,K.width,K.height,K.depth,0,ot,P,K.data);else if(x.isFramebufferTexture){if(at)if(st)e.texStorage2D(i.TEXTURE_2D,Vt,Z,K.width,K.height);else{let nt=K.width,Pt=K.height;for(let Ht=0;Ht<Vt;Ht++)e.texImage2D(i.TEXTURE_2D,Ht,Z,nt,Pt,0,ot,P,null),nt>>=1,Pt>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in i){const nt=i.canvas;if(nt.hasAttribute("layoutsubtree")||nt.setAttribute("layoutsubtree","true"),K.parentNode!==nt){nt.appendChild(K),d.add(x),nt.onpaint=Pt=>{const Ht=Pt.changedElements;for(const gt of d)Ht.includes(gt.image)&&(gt.needsUpdate=!0)},nt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,K);else{const Ht=i.RGBA,gt=i.RGBA,se=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Ht,gt,se,K)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(lt.length>0){if(st&&at){const nt=Ut(lt[0]);e.texStorage2D(i.TEXTURE_2D,Vt,Z,nt.width,nt.height)}for(let nt=0,Pt=lt.length;nt<Pt;nt++)Y=lt[nt],st?At&&e.texSubImage2D(i.TEXTURE_2D,nt,0,0,ot,P,Y):e.texImage2D(i.TEXTURE_2D,nt,Z,ot,P,Y);x.generateMipmaps=!1}else if(st){if(at){const nt=Ut(K);e.texStorage2D(i.TEXTURE_2D,Vt,Z,nt.width,nt.height)}At&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,ot,P,K)}else e.texImage2D(i.TEXTURE_2D,0,Z,ot,P,K);T(x)&&x.mipmapsAutoUpdate===!0&&S(et),ht.__version=rt.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function en(A,x,H){if(x.image.length!==6)return;const et=oe(A,x),Q=x.source;e.bindTexture(i.TEXTURE_CUBE_MAP,A.__webglTexture,i.TEXTURE0+H);const rt=n.get(Q);if(Q.version!==rt.__version||et===!0){e.activeTexture(i.TEXTURE0+H);const ht=Jt.getPrimaries(Jt.workingColorSpace),$=x.colorSpace===hi?null:Jt.getPrimaries(x.colorSpace),K=x.colorSpace===hi||ht===$?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,K);const ot=x.isCompressedTexture||x.image[0].isCompressedTexture,P=x.image[0]&&x.image[0].isDataTexture,Z=[];for(let gt=0;gt<6;gt++)!ot&&!P?Z[gt]=M(x.image[gt],!0,s.maxCubemapSize):Z[gt]=P?x.image[gt].image:x.image[gt],Z[gt]=Lt(x,Z[gt]);const Y=Z[0],lt=r.convert(x.format,x.colorSpace),st=r.convert(x.type);let at=w(x.internalFormat,lt,st,x.normalized,x.colorSpace);const At=x.isVideoTexture!==!0,Vt=rt.__version===void 0||et===!0,nt=Q.dataReady;let Pt=E(x,Y);ie(i.TEXTURE_CUBE_MAP,x);let Ht;if(x.isDepthTexture){if(at=g(x.format===pi,x.type),Vt)if(At)e.texStorage2D(i.TEXTURE_CUBE_MAP,1,at,Y.width,Y.height);else for(let gt=0;gt<6;gt++)e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,at,Y.width,Y.height,0,lt,st,null)}else if(ot){At&&Vt&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Pt,at,Y.width,Y.height);for(let gt=0;gt<6;gt++){Ht=Z[gt].mipmaps;for(let se=0;se<Ht.length;se++){const Ce=Ht[se];x.format!==Un?lt!==null?At?nt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se,0,0,Ce.width,Ce.height,lt,Ce.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se,at,Ce.width,Ce.height,0,Ce.data):Nt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):At?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se,0,0,Ce.width,Ce.height,lt,st,Ce.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se,at,Ce.width,Ce.height,0,lt,st,Ce.data)}}}else{if(Ht=x.mipmaps,At&&Vt){Ht.length>0&&Pt++;const gt=Ut(Z[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Pt,at,gt.width,gt.height)}for(let gt=0;gt<6;gt++)if(P){At?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,0,0,Z[gt].width,Z[gt].height,lt,st,Z[gt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,at,Z[gt].width,Z[gt].height,0,lt,st,Z[gt].data);for(let se=0;se<Ht.length;se++){const ei=Ht[se].image[gt].image;At?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se+1,0,0,ei.width,ei.height,lt,st,ei.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se+1,at,ei.width,ei.height,0,lt,st,ei.data)}}else{At?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,0,0,lt,st,Z[gt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,at,lt,st,Z[gt]);for(let se=0;se<Ht.length;se++){const Ce=Ht[se];At?nt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se+1,0,0,lt,st,Ce.image[gt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,se+1,at,lt,st,Ce.image[gt])}}}T(x)&&x.mipmapsAutoUpdate===!0&&S(i.TEXTURE_CUBE_MAP),rt.__version=Q.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function fe(A,x,H,et,Q,rt){const ht=r.convert(H.format,H.colorSpace),$=r.convert(H.type),K=w(H.internalFormat,ht,$,H.normalized,H.colorSpace),ot=n.get(x),P=n.get(H);if(P.__renderTarget=x,!ot.__hasExternalTextures){const Z=Math.max(1,x.width>>rt),Y=Math.max(1,x.height>>rt);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?e.texImage3D(Q,rt,K,Z,Y,x.depth,0,ht,$,null):e.texImage2D(Q,rt,K,Z,Y,0,ht,$,null)}e.bindFramebuffer(i.FRAMEBUFFER,A),mt(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,et,Q,P.__webglTexture,0,he(x)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,et,Q,P.__webglTexture,rt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function Pn(A,x,H){if(i.bindRenderbuffer(i.RENDERBUFFER,A),x.depthBuffer){const et=x.depthTexture,Q=et&&et.isDepthTexture?et.type:null,rt=g(x.stencilBuffer,Q),ht=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;mt(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,he(x),rt,x.width,x.height):H?i.renderbufferStorageMultisample(i.RENDERBUFFER,he(x),rt,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,rt,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ht,i.RENDERBUFFER,A)}else{const et=x.textures;for(let Q=0;Q<et.length;Q++){const rt=et[Q],ht=r.convert(rt.format,rt.colorSpace),$=r.convert(rt.type),K=w(rt.internalFormat,ht,$,rt.normalized,rt.colorSpace);mt(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,he(x),K,x.width,x.height):H?i.renderbufferStorageMultisample(i.RENDERBUFFER,he(x),K,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,K,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Re(A,x,H){const et=x.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,A),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const Q=n.get(x.depthTexture);Q.__renderTarget=x;const rt=et?x.depthTexture.image[0]:x.depthTexture.image;(!Q.__webglTexture||rt.width!==x.width||rt.height!==x.height)&&(rt.width=x.width,rt.height=x.height,x.depthTexture.needsUpdate=!0),et?ft(x.depthTexture,0):pt(x.depthTexture,0);const ht=Q.__webglTexture,$=he(x),K=et?i.TEXTURE_CUBE_MAP_POSITIVE_X+H:i.TEXTURE_2D,ot=x.depthTexture.format===pi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(x.depthTexture.format===gi)mt(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ot,K,ht,0,$):i.framebufferTexture2D(i.FRAMEBUFFER,ot,K,ht,0);else if(x.depthTexture.format===pi)mt(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ot,K,ht,0,$):i.framebufferTexture2D(i.FRAMEBUFFER,ot,K,ht,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function hn(A){const x=n.get(A),H=A.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==A.depthTexture){const et=A.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),et){const Q=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,et.removeEventListener("dispose",Q)};et.addEventListener("dispose",Q),x.__depthDisposeCallback=Q}x.__boundDepthTexture=et}if(A.depthTexture&&!x.__autoAllocateDepthBuffer)if(H)for(let et=0;et<6;et++)Re(x.__webglFramebuffer[et],A,et);else A.texture.mipmaps.length>0?Re(x.__webglFramebuffer[0],A,0):Re(x.__webglFramebuffer,A,0);else if(H){x.__webglDepthbuffer=[];for(let et=0;et<6;et++)if(e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[et]),x.__webglDepthbuffer[et]===void 0)x.__webglDepthbuffer[et]=i.createRenderbuffer(),Pn(x.__webglDepthbuffer[et],A,!1);else{const Q=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer[et];i.bindRenderbuffer(i.RENDERBUFFER,rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,rt)}}else if(A.texture.mipmaps.length>0?e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),Pn(x.__webglDepthbuffer,A,!1);else{const Q=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,rt)}e.bindFramebuffer(i.FRAMEBUFFER,null)}function dn(A,x,H){const et=n.get(A);x!==void 0&&fe(et.__webglFramebuffer,A,A.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),H!==void 0&&hn(A)}function fn(A){const x=A.texture,H=n.get(A),et=n.get(x);A.addEventListener("dispose",D),I(A);const Q=A.textures,rt=A.isWebGLCubeRenderTarget===!0,ht=Q.length>1;if(ht||(et.__webglTexture===void 0&&(et.__webglTexture=i.createTexture()),et.__version=x.version,a.memory.textures++),rt){H.__webglFramebuffer=[];for(let $=0;$<6;$++)if(x.mipmaps.length>0){H.__webglFramebuffer[$]=[];for(let K=0;K<x.mipmaps.length;K++)H.__webglFramebuffer[$][K]=i.createFramebuffer()}else H.__webglFramebuffer[$]=i.createFramebuffer()}else{if(x.mipmaps.length>0){H.__webglFramebuffer=[];for(let $=0;$<x.mipmaps.length;$++)H.__webglFramebuffer[$]=i.createFramebuffer()}else H.__webglFramebuffer=i.createFramebuffer();if(ht)for(let $=0,K=Q.length;$<K;$++){const ot=n.get(Q[$]);ot.__webglTexture===void 0&&(ot.__webglTexture=i.createTexture(),a.memory.textures++)}if(A.samples>0&&mt(A)===!1){H.__webglMultisampledFramebuffer=i.createFramebuffer(),H.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let $=0;$<Q.length;$++){const K=Q[$];H.__webglColorRenderbuffer[$]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,H.__webglColorRenderbuffer[$]);const ot=r.convert(K.format,K.colorSpace),P=r.convert(K.type),Z=w(K.internalFormat,ot,P,K.normalized,K.colorSpace,A.isXRRenderTarget===!0),Y=he(A);i.renderbufferStorageMultisample(i.RENDERBUFFER,Y,Z,A.width,A.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+$,i.RENDERBUFFER,H.__webglColorRenderbuffer[$])}i.bindRenderbuffer(i.RENDERBUFFER,null),A.depthBuffer&&(H.__webglDepthRenderbuffer=i.createRenderbuffer(),Pn(H.__webglDepthRenderbuffer,A,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(rt){e.bindTexture(i.TEXTURE_CUBE_MAP,et.__webglTexture),ie(i.TEXTURE_CUBE_MAP,x);for(let $=0;$<6;$++)if(x.mipmaps.length>0)for(let K=0;K<x.mipmaps.length;K++)fe(H.__webglFramebuffer[$][K],A,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,K);else fe(H.__webglFramebuffer[$],A,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);T(x)?S(i.TEXTURE_CUBE_MAP):x.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,x.mipmaps.length-1),e.unbindTexture()}else if(ht){for(let $=0,K=Q.length;$<K;$++){const ot=Q[$],P=n.get(ot);let Z=i.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(Z=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(Z,P.__webglTexture),ie(Z,ot),fe(H.__webglFramebuffer,A,ot,i.COLOR_ATTACHMENT0+$,Z,0),T(ot)&&S(Z)}e.unbindTexture()}else{let $=i.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&($=A.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture($,et.__webglTexture),ie($,x),x.mipmaps.length>0)for(let K=0;K<x.mipmaps.length;K++)fe(H.__webglFramebuffer[K],A,x,i.COLOR_ATTACHMENT0,$,K);else fe(H.__webglFramebuffer,A,x,i.COLOR_ATTACHMENT0,$,0);T(x)?S($):x.mipmaps.length>0&&i.texParameteri($,i.TEXTURE_MAX_LEVEL,x.mipmaps.length-1),e.unbindTexture()}A.depthBuffer&&hn(A)}function U(A){const x=A.textures;for(let H=0,et=x.length;H<et;H++){const Q=x[H];if(T(Q)&&Q.mipmapsAutoUpdate===!0){const rt=b(A),ht=n.get(Q).__webglTexture;e.bindTexture(rt,ht),S(rt),e.unbindTexture()}}}const pn=[];function ue(A){if(A.samples>0){if(mt(A)===!1){const x=A.textures,H=A.width,et=A.height;let Q=i.COLOR_BUFFER_BIT;const rt=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ht=n.get(A),$=x.length>1;if($)for(let ot=0;ot<x.length;ot++)e.bindFramebuffer(i.FRAMEBUFFER,ht.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,ht.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,ht.__webglMultisampledFramebuffer),A.texture.mipmaps.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ht.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ht.__webglFramebuffer);for(let ot=0;ot<x.length;ot++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),$){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ht.__webglColorRenderbuffer[ot]);const P=n.get(x[ot]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,P,0)}i.blitFramebuffer(0,0,H,et,0,0,H,et,Q,i.NEAREST),l===!0&&(pn.length=0,pn.push(i.COLOR_ATTACHMENT0+ot),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&pn.push(rt),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,pn))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),$)for(let ot=0;ot<x.length;ot++){e.bindFramebuffer(i.FRAMEBUFFER,ht.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.RENDERBUFFER,ht.__webglColorRenderbuffer[ot]);const P=n.get(x[ot]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,ht.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ot,i.TEXTURE_2D,P,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,ht.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&l){const x=A.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function he(A){return Math.min(s.maxSamples,A.samples)}function mt(A){const x=n.get(A);return A.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function Te(A){const x=a.render.frame;u.get(A)!==x&&(u.set(A,x),A.update())}function Lt(A,x){const H=A.colorSpace,et=A.format,Q=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||H!==bs&&H!==hi&&(Jt.getTransfer(H)===re?(et!==Un||Q!==ln)&&Nt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):te("WebGLTextures: Unsupported texture color space:",H)),x}function Ut(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(c.width=A.naturalWidth||A.width,c.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(c.width=A.displayWidth,c.height=A.displayHeight):(c.width=A.width,c.height=A.height),c}this.allocateTextureUnit=Rt,this.resetTextureUnits=J,this.getTextureUnits=j,this.setTextureUnits=ut,this.setTexture2D=pt,this.setTexture2DArray=St,this.setTexture3D=Ct,this.setTextureCube=ft,this.rebindTextures=dn,this.setupRenderTarget=fn,this.updateRenderTargetMipmap=U,this.updateMultisampleRenderTarget=ue,this.setupDepthRenderbuffer=hn,this.setupFrameBufferTexture=fe,this.useMultisampledRTT=mt,this.dispose=z}function Hg(i,t){function e(n,s=hi){let r;const a=Jt.getTransfer(s);if(n===ln)return i.UNSIGNED_BYTE;if(n===vo)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Mo)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Ic)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Nc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Lc)return i.BYTE;if(n===Dc)return i.SHORT;if(n===Ts)return i.UNSIGNED_SHORT;if(n===xo)return i.INT;if(n===Bn)return i.UNSIGNED_INT;if(n===bn)return i.FLOAT;if(n===zn)return i.HALF_FLOAT;if(n===Uc)return i.ALPHA;if(n===Fc)return i.RGB;if(n===Un)return i.RGBA;if(n===gi)return i.DEPTH_COMPONENT;if(n===pi)return i.DEPTH_STENCIL;if(n===So)return i.RED;if(n===yo)return i.RED_INTEGER;if(n===wi)return i.RG;if(n===Eo)return i.RG_INTEGER;if(n===To)return i.RGBA_INTEGER;if(n===dr||n===fr||n===pr||n===mr)if(a===re)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===dr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===fr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===mr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===dr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===fr)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===pr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===mr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===La||n===Da||n===Ia||n===Na)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===La)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Da)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ia)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Na)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Ua||n===Fa||n===Oa||n===Ba||n===za||n===yr||n===Ga)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Ua||n===Fa)return a===re?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Oa)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ba)return r.COMPRESSED_R11_EAC;if(n===za)return r.COMPRESSED_SIGNED_R11_EAC;if(n===yr)return r.COMPRESSED_RG11_EAC;if(n===Ga)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ha||n===ka||n===Va||n===Wa||n===Xa||n===qa||n===Ya||n===$a||n===Ka||n===Za||n===Ja||n===Qa||n===ja||n===to)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ha)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ka)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Va)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Wa)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Xa)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===qa)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Ya)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===$a)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ka)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Za)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ja)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Qa)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ja)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===to)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===eo||n===no||n===io)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===eo)return a===re?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===no)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===io)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===so||n===ro||n===Er||n===ao)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===so)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ro)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Er)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===ao)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===ts?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const kg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Vg=`
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

}`;class Wg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new Zc(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new Gn({vertexShader:kg,fragmentShader:Vg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new Xt(new xn(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Xg extends Ri{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",l=1,c=null,u=null,d=null,h=null,p=null,_=null;const v=typeof XRWebGLBinding<"u",m=new Wg,f={},M=e.getContextAttributes();let T=null,S=null;const b=[],w=[],g=new Gt;let E=null,I=null;const R=new En;R.viewport=new ge;const L=new En;L.viewport=new ge;const D=[R,L],B=new ed;let C=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let pt=b[q];return pt===void 0&&(pt=new ea,b[q]=pt),pt.getTargetRaySpace()},this.getControllerGrip=function(q){let pt=b[q];return pt===void 0&&(pt=new ea,b[q]=pt),pt.getGripSpace()},this.getHand=function(q){let pt=b[q];return pt===void 0&&(pt=new ea,b[q]=pt),pt.getHandSpace()};function V(q){const pt=w.indexOf(q.inputSource);if(pt===-1)return;const St=b[pt];St!==void 0&&(St.update(q.inputSource,q.frame,c||a),St.dispatchEvent({type:q.type,data:q.inputSource}))}function F(){s.removeEventListener("select",V),s.removeEventListener("selectstart",V),s.removeEventListener("selectend",V),s.removeEventListener("squeeze",V),s.removeEventListener("squeezestart",V),s.removeEventListener("squeezeend",V),s.removeEventListener("end",F),s.removeEventListener("inputsourceschange",tt);for(let q=0;q<b.length;q++){const pt=w[q];pt!==null&&(w[q]=null,b[q].disconnect(pt))}C=null,z=null,m.reset();for(const q in f)delete f[q];if(t.setRenderTarget(T),p=null,h=null,d=null,s=null,S=null,Rt.stop(),n.isPresenting=!1,t.setPixelRatio(E),t.setSize(g.width,g.height,!1),I!==null){const q=I.camera;q.fov=I.fov,q.zoom=I.zoom,q.updateProjectionMatrix(),I=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&Nt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,n.isPresenting===!0&&Nt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(q){c=q},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return d===null&&v&&(d=new XRWebGLBinding(s,e)),d},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(T=t.getRenderTarget(),s.addEventListener("select",V),s.addEventListener("selectstart",V),s.addEventListener("selectend",V),s.addEventListener("squeeze",V),s.addEventListener("squeezestart",V),s.addEventListener("squeezeend",V),s.addEventListener("end",F),s.addEventListener("inputsourceschange",tt),M.xrCompatible!==!0&&await e.makeXRCompatible(),E=t.getPixelRatio(),t.getSize(g),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let St=null,Ct=null,ft=null;M.depth&&(ft=M.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,St=M.stencil?pi:gi,Ct=M.stencil?ts:Bn);const zt={colorFormat:e.RGBA8,depthFormat:ft,scaleFactor:r};d=this.getBinding(),h=d.createProjectionLayer(zt),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),S=new Rn(h.textureWidth,h.textureHeight,{format:Un,type:ln,depthTexture:new es(h.textureWidth,h.textureHeight,Ct,void 0,void 0,void 0,void 0,void 0,void 0,St),stencilBuffer:M.stencil,colorSpace:t.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{const St={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,e,St),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),S=new Rn(p.framebufferWidth,p.framebufferHeight,{format:Un,type:ln,colorSpace:t.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),Rt.setContext(s),Rt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function tt(q){for(let pt=0;pt<q.removed.length;pt++){const St=q.removed[pt],Ct=w.indexOf(St);Ct>=0&&(w[Ct]=null,b[Ct].disconnect(St))}for(let pt=0;pt<q.added.length;pt++){const St=q.added[pt];let Ct=w.indexOf(St);if(Ct===-1){for(let zt=0;zt<b.length;zt++)if(zt>=w.length){w.push(St),Ct=zt;break}else if(w[zt]===null){w[zt]=St,Ct=zt;break}if(Ct===-1)break}const ft=b[Ct];ft&&ft.connect(St)}}function W(q,pt){pt===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(pt.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let pt=q.near,St=q.far;m.texture!==null&&(m.depthNear>0&&(pt=m.depthNear),m.depthFar>0&&(St=m.depthFar)),B.near=L.near=R.near=pt,B.far=L.far=R.far=St,(C!==B.near||z!==B.far)&&(s.updateRenderState({depthNear:B.near,depthFar:B.far}),C=B.near,z=B.far),B.layers.mask=q.layers.mask|6,R.layers.mask=B.layers.mask&-5,L.layers.mask=B.layers.mask&-3;const Ct=q.parent,ft=B.cameras;W(B,Ct);for(let zt=0;zt<ft.length;zt++)W(ft[zt],Ct);B.projectionMatrix.copy(R.projectionMatrix),B.projectionMatrixInverse.copy(R.projectionMatrixInverse),I===null&&q.isPerspectiveCamera&&(I={camera:q,fov:q.fov,zoom:q.zoom}),J(q,B,Ct)};function J(q,pt,St){St===null?q.matrix.copy(pt.matrixWorld):(q.matrix.copy(St.matrixWorld),q.matrix.invert(),q.matrix.multiply(pt.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(pt.projectionMatrix),q.projectionMatrixInverse.copy(pt.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=lo*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return B},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function(q){l=q,h!==null&&(h.fixedFoveation=q),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=q)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(B)},this.getCameraTexture=function(q){return f[q]};let j=null;function ut(q,pt){if(u=pt.getViewerPose(c||a),_=pt,u!==null){const St=u.views;p!==null&&(t.setRenderTargetFramebuffer(S,p.framebuffer),t.setRenderTarget(S));let Ct=!1;St.length!==B.cameras.length&&(B.cameras.length=0,Ct=!0);for(let It=0;It<St.length;It++){const ie=St[It];let oe=null;if(p!==null)oe=p.getViewport(ie);else{const Be=d.getViewSubImage(h,ie);oe=Be.viewport,It===0&&(t.setRenderTargetTextures(S,Be.colorTexture,Be.depthStencilTexture),t.setRenderTarget(S))}let $t=D[It];$t===void 0&&($t=new En,$t.layers.enable(It),$t.viewport=new ge,D[It]=$t),$t.matrix.fromArray(ie.transform.matrix),$t.matrix.decompose($t.position,$t.quaternion,$t.scale),$t.projectionMatrix.fromArray(ie.projectionMatrix),$t.projectionMatrixInverse.copy($t.projectionMatrix).invert(),$t.viewport.set(oe.x,oe.y,oe.width,oe.height),It===0&&(B.matrix.copy($t.matrix),B.matrix.decompose(B.position,B.quaternion,B.scale)),Ct===!0&&B.cameras.push($t)}const ft=s.enabledFeatures;if(ft&&ft.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&v){d=n.getBinding();const It=d.getDepthInformation(St[0]);It&&It.isValid&&It.texture&&m.init(It,s.renderState)}if(ft&&ft.includes("camera-access")&&v){t.state.unbindTexture(),d=n.getBinding();for(let It=0;It<St.length;It++){const ie=St[It].camera;if(ie){let oe=f[ie];oe||(oe=new Zc,f[ie]=oe);const $t=d.getCameraImage(ie);oe.sourceTexture=$t}}}}for(let St=0;St<b.length;St++){const Ct=w[St],ft=b[St];Ct!==null&&ft!==void 0&&ft.update(Ct,pt,c||a)}j&&j(q,pt),pt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:pt}),_=null}const Rt=new jc;Rt.setAnimationLoop(ut),this.setAnimationLoop=function(q){j=q},this.dispose=function(){}}}const qg=new ne,cu=new Ft;cu.set(-1,0,0,0,1,0,0,0,1);function Yg(i,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function n(m,f){f.color.getRGB(m.fogColor.value,Jc(i)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function s(m,f,M,T,S){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?r(m,f):f.isMeshLambertMaterial?(r(m,f),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(r(m,f),d(m,f)):f.isMeshPhongMaterial?(r(m,f),u(m,f),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(r(m,f),h(m,f),f.isMeshPhysicalMaterial&&p(m,f,S)):f.isMeshMatcapMaterial?(r(m,f),_(m,f)):f.isMeshDepthMaterial?r(m,f):f.isMeshDistanceMaterial?(r(m,f),v(m,f)):f.isMeshNormalMaterial?r(m,f):f.isLineBasicMaterial?(a(m,f),f.isLineDashedMaterial&&o(m,f)):f.isPointsMaterial?l(m,f,M,T):f.isSpriteMaterial?c(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===je&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===je&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);const M=t.get(f),T=M.envMap,S=M.envMapRotation;T&&(m.envMap.value=T,m.envMapRotation.value.setFromMatrix4(qg.makeRotationFromEuler(S)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(cu),m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function a(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function o(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function l(m,f,M,T){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*M,m.scale.value=T*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function c(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function u(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function d(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function h(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,M){m.ior.value=f.ior,f.diffuseRoughness>0&&(m.diffuseRoughness.value=f.diffuseRoughness,f.diffuseRoughnessMap&&(m.diffuseRoughnessMap.value=f.diffuseRoughnessMap,e(f.diffuseRoughnessMap,m.diffuseRoughnessMapTransform))),f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===je&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.retroreflectivity>0&&(m.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessMinimum,m.iridescenceThicknessMaximum.value=f.iridescenceThicknessMaximum,f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,f){f.matcap&&(m.matcap.value=f.matcap)}function v(m,f){const M=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function $g(i,t,e,n){let s={},r={};function a(M,T){const S=T.program;n.uniformBlockBinding(M,S,s[M.id])}function o(M,T){let S=s[M.id];S===void 0&&(_(M),S=l(M),s[M.id]=S,M.addEventListener("dispose",m));const b=T.program;n.updateUBOMapping(M,b);const w=t.render.frame;r[M.id]!==w&&(c(M),r[M.id]=w)}function l(M){const T=i.createBuffer(),S=M.__size,b=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,S,b),i.bindBuffer(i.UNIFORM_BUFFER,null),T}function c(M){const T=s[M.id],S=M.uniforms,b=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let w=0,g=S.length;w<g;w++){const E=S[w];if(Array.isArray(E))for(let I=0,R=E.length;I<R;I++)u(E[I],w,I,b);else u(E,w,0,b)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function u(M,T,S,b){if(h(M,T,S,b)===!0){const w=M.__offset,g=M.value;if(Array.isArray(g)){let E=0;for(let I=0;I<g.length;I++){const R=g[I],L=v(R,!0);d(R,M.__data,E),E+=L.storage/Float32Array.BYTES_PER_ELEMENT}}else d(g,M.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,w,M.__data)}}function d(M,T,S){typeof M=="number"||typeof M=="boolean"?T[S]=M:M.isMatrix3?(T[S]=M.elements[0],T[S+1]=M.elements[1],T[S+2]=M.elements[2],T[S+3]=0,T[S+4]=M.elements[3],T[S+5]=M.elements[4],T[S+6]=M.elements[5],T[S+7]=0,T[S+8]=M.elements[6],T[S+9]=M.elements[7],T[S+10]=M.elements[8],T[S+11]=0):ArrayBuffer.isView(M)?T.set(M.subarray(0,T.length-S),S):M.toArray(T,S)}function h(M,T,S,b){const w=M.value,g=T+"_"+S;if(Array.isArray(w)){b[g]===void 0&&(b[g]=[]);const E=b[g];let I=!1;for(let R=0;R<w.length;R++)p(w[R],E,R)===!0&&(I=!0);return I}return p(w,b,g)}function p(M,T,S){if(T[S]===void 0)return typeof M=="number"||typeof M=="boolean"?T[S]=M:ArrayBuffer.isView(M)?T[S]=M.slice():T[S]=M.clone(),!0;{const b=T[S];if(typeof M=="number"||typeof M=="boolean"){if(b!==M)return T[S]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(b.equals(M)===!1)return b.copy(M),!0}}return!1}function _(M){const T=M.uniforms;let S=0;const b=16;for(let g=0,E=T.length;g<E;g++){const I=Array.isArray(T[g])?T[g]:[T[g]];for(let R=0,L=I.length;R<L;R++){const D=I[R],B=Array.isArray(D.value)?D.value:[D.value],C=Array.isArray(T[g])||Array.isArray(D.value);let z=S;for(let F=0,tt=B.length;F<tt;F++){const W=B[F],J=v(W,C),j=S%b,ut=j%J.boundary,Rt=j+ut;S+=ut,Rt!==0&&b-Rt<J.storage&&(S+=b-Rt),F===0&&(z=S),S+=J.storage}const V=D.type==="int"?Int32Array:D.type==="uint"?Uint32Array:Float32Array;D.__data=new V((S-z)/Float32Array.BYTES_PER_ELEMENT),D.__offset=z}}const w=S%b;return w>0&&(S+=b-w),M.__size=S,M.__cache={},this}function v(M,T){const S={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(S.boundary=4,S.storage=4):M.isVector2?(S.boundary=8,S.storage=8):M.isVector3||M.isColor?(S.boundary=16,S.storage=12):M.isVector4?(S.boundary=16,S.storage=16):M.isMatrix3?(S.boundary=16,S.storage=48):M.isMatrix4?(S.boundary=16,S.storage=64):M.isTexture?Nt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(S.boundary=16,S.storage=M.byteLength):Nt("WebGLRenderer: Unsupported uniform value type.",M),T===!0&&(S.boundary=16,S.storage=Math.ceil(S.storage/16)*16),S}function m(M){const T=M.target;T.removeEventListener("dispose",m),i.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function f(){for(const M in s)i.deleteBuffer(s[M]);s={},r={}}return{bind:a,update:o,dispose:f}}const Kg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Dn=null;function Zg(){return Dn===null&&(Dn=new qc(Kg,16,16,wi,zn),Dn.name="DFG_LUT",Dn.minFilter=Qe,Dn.magFilter=Qe,Dn.wrapS=Kn,Dn.wrapT=Kn,Dn.generateMipmaps=!1,Dn.needsUpdate=!0),Dn}class Jg{constructor(t={}){const{canvas:e=ch(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:h=!1,outputBufferType:p=ln}=t;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=a;const v=p,m=new Set([To,Eo,yo]),f=new Set([ln,Bn,Ts,ts,vo,Mo]),M=new Uint32Array(4),T=new Int32Array(4),S={textures:[],min:[],max:[],resolution:[]};let b=null,w=null;const g=[],E=[];let I=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Jn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const R=this;let L=!1,D=null,B=null,C=null,z=null;this._outputColorSpace=Ye;let V=0,F=0,tt=null,W=-1,J=null;const j=new ge,ut=new ge;let Rt=null;const q=new Dt(0);let pt=0,St=e.width,Ct=e.height,ft=1,zt=null,ve=null;const It=new ge(0,0,St,Ct),ie=new ge(0,0,St,Ct);let oe=!1;const $t=new Rs,Be=new Po;let Ee=!1,en=!1;const fe=new ne,Pn=new O,Re=new ge,hn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let dn=!1;function fn(){return tt===null?ft:1}let U=n;function pn(y,N){return e.getContext(y,N)}let ue,he,mt,Te,Lt,Ut,A,x,H,et,Q,rt,ht,$,K,ot,P,Z,Y,lt,st,at,At;try{const y={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${go}`),e.addEventListener("webglcontextlost",Pt,!1),e.addEventListener("webglcontextrestored",Ht,!1),e.addEventListener("webglcontextcreationerror",gt,!1),U===null){const N="webgl2";if(U=pn(N,y),U===null)throw pn(N)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Vt()}catch(y){throw e.removeEventListener("webglcontextlost",Pt,!1),e.removeEventListener("webglcontextrestored",Ht,!1),e.removeEventListener("webglcontextcreationerror",gt,!1),te("WebGLRenderer: "+y.message),y}function Vt(){ue=new tm(U),ue.init(),st=new Hg(U,ue),he=new Vp(U,ue,t,st),mt=new zg(U,ue),he.reversedDepthBuffer&&h&&mt.buffers.depth.setReversed(!0),B=U.createFramebuffer(),C=U.createFramebuffer(),z=U.createFramebuffer(),Te=new im(U),Lt=new bg,Ut=new Gg(U,ue,mt,Lt,he,st,Te),A=new jp(R),x=new sd(U),at=new Hp(U,x),H=new em(U,x,Te,at),et=new rm(U,H,x,at,Te),Z=new sm(U,he,Ut),K=new Wp(Lt),Q=new Tg(R,A,ue,he,at,K),rt=new Yg(R,Lt),ht=new Ag,$=new Ig(ue),P=new Gp(R,A,mt,et,_,l),ot=new Bg(R,et,he),At=new $g(U,Te,he,mt),Y=new kp(U,ue,Te),lt=new nm(U,ue,Te),Te.programs=Q.programs,R.capabilities=he,R.extensions=ue,R.properties=Lt,R.renderLists=ht,R.shadowMap=ot,R.state=mt,R.info=Te}v!==ln&&(I=new om(v,e.width,e.height,o,s,r));const nt=new Xg(R,U);this.xr=nt,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){const y=ue.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=ue.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return ft},this.setPixelRatio=function(y){y!==void 0&&(ft=y,this.setSize(St,Ct,!1))},this.getSize=function(y){return y.set(St,Ct)},this.setSize=function(y,N,X=!0){if(nt.isPresenting){Nt("WebGLRenderer: Can't change size while VR device is presenting.");return}St=y,Ct=N,e.width=Math.floor(y*ft),e.height=Math.floor(N*ft),X===!0&&(e.style.width=y+"px",e.style.height=N+"px"),I!==null&&I.setSize(e.width,e.height),this.setViewport(0,0,y,N)},this.getDrawingBufferSize=function(y){return y.set(St*ft,Ct*ft).floor()},this.setDrawingBufferSize=function(y,N,X){St=y,Ct=N,ft=X,e.width=Math.floor(y*X),e.height=Math.floor(N*X),this.setViewport(0,0,y,N)},this.setEffects=function(y){if(v===ln){te("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(y){for(let N=0;N<y.length;N++)if(y[N].isOutputPass===!0){Nt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}I.setEffects(y||[])},this.getCurrentViewport=function(y){return y.copy(j)},this.getViewport=function(y){return y.copy(It)},this.setViewport=function(y,N,X,G){y.isVector4?It.set(y.x,y.y,y.z,y.w):It.set(y,N,X,G),mt.viewport(j.copy(It).multiplyScalar(fn()).round())},this.getScissor=function(y){return y.copy(ie)},this.setScissor=function(y,N,X,G){y.isVector4?ie.set(y.x,y.y,y.z,y.w):ie.set(y,N,X,G),mt.scissor(ut.copy(ie).multiplyScalar(fn()).round())},this.getScissorTest=function(){return oe},this.setScissorTest=function(y){mt.setScissorTest(oe=y)},this.setOpaqueSort=function(y){zt=y},this.setTransparentSort=function(y){ve=y},this.getClearColor=function(y){return y.copy(P.getClearColor())},this.setClearColor=function(){P.setClearColor(...arguments)},this.getClearAlpha=function(){return P.getClearAlpha()},this.setClearAlpha=function(){P.setClearAlpha(...arguments)},this.clear=function(y=!0,N=!0,X=!0){let G=0;if(y){let k=!1;if(tt!==null){const dt=tt.texture.format;k=m.has(dt)}if(k){const dt=tt.texture.type,Et=f.has(dt),ct=P.getClearColor(),vt=P.getClearAlpha(),wt=ct.r,Ot=ct.g,Kt=ct.b;Et?(M[0]=wt,M[1]=Ot,M[2]=Kt,M[3]=vt,U.clearBufferuiv(U.COLOR,0,M)):(T[0]=wt,T[1]=Ot,T[2]=Kt,T[3]=vt,U.clearBufferiv(U.COLOR,0,T))}else G|=U.COLOR_BUFFER_BIT}N&&(G|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),X&&(G|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&U.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(y){y.setRenderer(this),D=y},this.dispose=function(){e.removeEventListener("webglcontextlost",Pt,!1),e.removeEventListener("webglcontextrestored",Ht,!1),e.removeEventListener("webglcontextcreationerror",gt,!1),P.dispose(),ht.dispose(),$.dispose(),Ut.dispose(),Lt.dispose(),A.dispose(),et.dispose(),H.dispose(),at.dispose(),At.dispose(),Q.dispose(),nt.dispose(),nt.removeEventListener("sessionstart",Qo),nt.removeEventListener("sessionend",jo),xi.stop()};function Pt(y){y.preventDefault(),pl("WebGLRenderer: Context Lost."),L=!0}function Ht(){pl("WebGLRenderer: Context Restored."),L=!1;const y=Te.autoReset,N=ot.enabled,X=ot.autoUpdate,G=ot.needsUpdate,k=ot.type;Vt(),Te.autoReset=y,ot.enabled=N,ot.autoUpdate=X,ot.needsUpdate=G,ot.type=k}function gt(y){te("WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function se(y){const N=y.target;N.removeEventListener("dispose",se),Ce(N)}function Ce(y){ei(y),Lt.remove(y)}function ei(y){const N=Lt.get(y).programs;N!==void 0&&(N.forEach(function(X){Q.releaseProgram(X)}),y.isShaderMaterial&&Q.releaseShaderCache(y))}this.renderBufferDirect=function(y,N,X,G,k,dt){N===null&&(N=hn);const Et=k.isMesh&&k.matrixWorld.determinantAffine()<0,ct=wu(y,N,X,G,k);mt.setMaterial(G,Et);let vt=X.index,wt=1;if(G.wireframe===!0){if(vt=H.getWireframeAttribute(X),vt===void 0)return;wt=2}const Ot=X.drawRange,Kt=X.attributes.position;let Tt=Ot.start*wt,Zt=(Ot.start+Ot.count)*wt;dt!==null&&(Tt=Math.max(Tt,dt.start*wt),Zt=Math.min(Zt,(dt.start+dt.count)*wt)),vt!==null?(Tt=Math.max(Tt,0),Zt=Math.min(Zt,vt.count)):Kt!=null&&(Tt=Math.max(Tt,0),Zt=Math.min(Zt,Kt.count));const Me=Zt-Tt;if(Me<0||Me===1/0)return;at.setup(k,G,ct,X,vt);let ce,le=Y;if(vt!==null&&(ce=x.get(vt),le=lt,le.setIndex(ce)),k.isMesh)G.wireframe===!0?(mt.setLineWidth(G.wireframeLinewidth*fn()),le.setMode(U.LINES)):le.setMode(U.TRIANGLES);else if(k.isLine){let ke=G.linewidth;ke===void 0&&(ke=1),mt.setLineWidth(ke*fn()),k.isLineSegments?le.setMode(U.LINES):k.isLineLoop?le.setMode(U.LINE_LOOP):le.setMode(U.LINE_STRIP)}else k.isPoints?le.setMode(U.POINTS):k.isSprite&&le.setMode(U.TRIANGLES);if(k.isBatchedMesh)if(ue.get("WEBGL_multi_draw"))le.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{const ke=k._multiDrawStarts,bt=k._multiDrawCounts,Ze=k._multiDrawCount,ee=vt?x.get(vt).bytesPerElement:1,vi=Lt.get(G).currentProgram.getUniforms();for(let Ve=0;Ve<Ze;Ve++)vi.setValue(U,"_gl_DrawID",Ve),le.render(ke[Ve]/ee,bt[Ve])}else if(k.isInstancedMesh)le.renderInstances(Tt,Me,k.count);else if(X.isInstancedBufferGeometry){const ke=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,bt=Math.min(X.instanceCount,ke);le.renderInstances(Tt,Me,bt)}else le.render(Tt,Me)};function Jo(y,N,X,G){D!==null&&y.isNodeMaterial&&D.setObject(G,y),Ee===!0&&K.setState(y,X,!1),y.transparent===!0&&y.side===_n&&y.forceSinglePass===!1?(y.side=je,y.needsUpdate=!0,os(y,N,G),y.side=ti,y.needsUpdate=!0,os(y,N,G),y.side=_n):os(y,N,G)}this.compile=function(y,N,X=null){X===null&&(X=y),D!==null&&D.renderStart(y,N,X),w=$.get(X),w.init(N),E.push(w),X.traverseVisible(function(k){k.isLight&&k.layers.test(N.layers)&&(w.pushLight(k),k.castShadow&&w.pushShadow(k))}),y!==X&&y.traverseVisible(function(k){k.isLight&&k.layers.test(N.layers)&&(w.pushLight(k),k.castShadow&&w.pushShadow(k))}),w.setupLights(),D!==null&&D.updateLights(w.state.lightsArray),en=this.localClippingEnabled,Ee=K.init(this.clippingPlanes,en),Ee===!0&&K.setGlobalState(this.clippingPlanes,N),D!==null&&ot.render(w.state.shadowsArray,X,N);const G=new Set;return y.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;const dt=k.material;if(dt)if(Array.isArray(dt))for(let Et=0;Et<dt.length;Et++){const ct=dt[Et];Jo(ct,X,N,k),G.add(ct)}else Jo(dt,X,N,k),G.add(dt)}),w=E.pop(),D!==null&&D.renderEnd(),G},this.compileAsync=function(y,N,X=null){const G=this.compile(y,N,X);return new Promise(k=>{function dt(){if(G.forEach(function(Et){const vt=Lt.get(Et).currentProgram;(vt===void 0||vt.isReady())&&G.delete(Et)}),G.size===0){k(y);return}setTimeout(dt,10)}ue.get("KHR_parallel_shader_compile")!==null?dt():setTimeout(dt,10)})};let kr=null;function Tu(y){kr&&kr(y)}function Qo(){xi.stop()}function jo(){xi.start()}const xi=new jc;xi.setAnimationLoop(Tu),typeof self<"u"&&xi.setContext(self),this.setAnimationLoop=function(y){kr=y,nt.setAnimationLoop(y),y===null?xi.stop():xi.start()},nt.addEventListener("sessionstart",Qo),nt.addEventListener("sessionend",jo),this.render=function(y,N){if(N!==void 0&&N.isCamera!==!0){te("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;D!==null&&D.renderStart(y,N);const X=nt.enabled===!0&&nt.isPresenting===!0,G=I!==null&&(tt===null||X)&&I.begin(R,tt);if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),N.parent===null&&N.matrixWorldAutoUpdate===!0&&N.updateMatrixWorld(),nt.enabled===!0&&nt.isPresenting===!0&&(I===null||I.isCompositing()===!1)&&(nt.cameraAutoUpdate===!0&&nt.updateCamera(N),N=nt.getCamera()),y.isScene===!0&&y.onBeforeRender(R,y,N,tt),w=$.get(y,E.length),w.init(N),w.state.textureUnits=Ut.getTextureUnits(),E.push(w),fe.multiplyMatrices(N.projectionMatrix,N.matrixWorldInverse),N.isArrayCamera?Be.setFromArrayCamera(N):$t.setFromProjectionMatrix(fe,wn,N.reversedDepth),en=this.localClippingEnabled,Ee=K.init(this.clippingPlanes,en),b=ht.get(y,g.length),b.init(),g.push(b),this.info.render.frame++,nt.enabled===!0&&nt.isPresenting===!0){const Et=R.xr.getDepthSensingMesh();Et!==null&&Vr(Et,N,-1/0,R.sortObjects)}Vr(y,N,0,R.sortObjects),b.finish(),D!==null&&D.updateLights(w.state.lightsArray),R.sortObjects===!0&&b.sort(zt,ve),dn=nt.enabled===!1||nt.isPresenting===!1||nt.hasDepthSensing()===!1,dn&&P.addToRenderList(b,y),this.info.autoReset===!0&&this.info.reset(),Ee===!0&&K.beginShadows();const k=w.state.shadowsArray;if(ot.render(k,y,N),Ee===!0&&K.endShadows(),(G&&I.hasRenderPass())===!1){const Et=b.opaque,ct=b.transmissive;if(w.setupLights(),N.isArrayCamera){const vt=N.cameras;if(ct.length>0)for(let wt=0,Ot=vt.length;wt<Ot;wt++){const Kt=vt[wt];el(Et,ct,y,Kt)}dn&&P.render(y);for(let wt=0,Ot=vt.length;wt<Ot;wt++){const Kt=vt[wt];tl(b,y,Kt,Kt.viewport)}}else ct.length>0&&el(Et,ct,y,N),dn&&P.render(y),tl(b,y,N)}tt!==null&&F===0&&(Ut.updateMultisampleRenderTarget(tt),Ut.updateRenderTargetMipmap(tt)),G&&I.end(R),y.isScene===!0&&y.onAfterRender(R,y,N),at.resetDefaultState(),W=-1,J=null,E.pop(),E.length>0?(w=E[E.length-1],Ut.setTextureUnits(w.state.textureUnits),Ee===!0&&K.setGlobalState(R.clippingPlanes,w.state.camera)):w=null,g.pop(),g.length>0?b=g[g.length-1]:b=null,D!==null&&D.renderEnd()};function Vr(y,N,X,G){if(y.visible===!1)return;if(y.layers.test(N.layers)){if(y.isGroup)X=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(N);else if(y.isLight)w.pushLight(y),y.castShadow&&w.pushShadow(y);else if(y.isSprite){const Et=N.isArrayCamera?Be:$t;if(!y.frustumCulled||y.intersectsFrustum(Et)){G&&Re.setFromMatrixPosition(y.matrixWorld).applyMatrix4(fe);const ct=et.update(y),vt=y.material;vt.visible&&b.push(y,ct,vt,X,Re.z,null,N)}}else if(y.isMesh||y.isLine||y.isPoints){const Et=N.isArrayCamera?Be:$t;if(!y.frustumCulled||y.intersectsFrustum(Et)){const ct=et.update(y),vt=y.material;if(G&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),Re.copy(y.boundingSphere.center)):(ct.boundingSphere===null&&ct.computeBoundingSphere(),Re.copy(ct.boundingSphere.center)),Re.applyMatrix4(y.matrixWorld).applyMatrix4(fe)),Array.isArray(vt)){const wt=ct.groups;for(let Ot=0,Kt=wt.length;Ot<Kt;Ot++){const Tt=wt[Ot],Zt=vt[Tt.materialIndex];Zt&&Zt.visible&&b.push(y,ct,Zt,X,Re.z,Tt,N)}}else vt.visible&&b.push(y,ct,vt,X,Re.z,null,N)}}}const dt=y.children;for(let Et=0,ct=dt.length;Et<ct;Et++)Vr(dt[Et],N,X,G)}function tl(y,N,X,G){const{opaque:k,transmissive:dt,transparent:Et}=y;w.setupLightsView(X),Ee===!0&&K.setGlobalState(R.clippingPlanes,X),G&&mt.viewport(j.copy(G)),k.length>0&&Us(k,N,X),dt.length>0&&Us(dt,N,X),Et.length>0&&Us(Et,N,X),mt.buffers.depth.setTest(!0),mt.buffers.depth.setMask(!0),mt.buffers.color.setMask(!0),mt.setPolygonOffset(!1)}function el(y,N,X,G){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[G.id]===void 0){const Tt=ue.has("EXT_color_buffer_half_float")||ue.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[G.id]=new Rn(1,1,{generateMipmaps:!0,type:Tt?zn:ln,minFilter:Zn,samples:Math.max(4,he.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Jt.workingColorSpace})}const dt=w.state.transmissionRenderTarget[G.id],Et=G.viewport||j;dt.setSize(Et.z*R.transmissionResolutionScale,Et.w*R.transmissionResolutionScale);const ct=R.getRenderTarget(),vt=R.getActiveCubeFace(),wt=R.getActiveMipmapLevel();R.setRenderTarget(dt),R.getClearColor(q),pt=R.getClearAlpha(),pt<1&&R.setClearColor(16777215,.5),R.clear(),dn&&P.render(X);const Ot=R.toneMapping;R.toneMapping=Jn;const Kt=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),w.setupLightsView(G),Ee===!0&&K.setGlobalState(R.clippingPlanes,G),Us(y,X,G),Ut.updateMultisampleRenderTarget(dt),Ut.updateRenderTargetMipmap(dt),ue.has("WEBGL_multisampled_render_to_texture")===!1){let Tt=!1;for(let Zt=0,Me=N.length;Zt<Me;Zt++){const ce=N[Zt],{object:le,geometry:ke,material:bt,group:Ze}=ce;if(bt.side===_n&&le.layers.test(G.layers)){const ee=bt.side;bt.side=je,bt.needsUpdate=!0,nl(le,X,G,ke,bt,Ze),bt.side=ee,bt.needsUpdate=!0,Tt=!0}}Tt===!0&&(Ut.updateMultisampleRenderTarget(dt),Ut.updateRenderTargetMipmap(dt))}R.setRenderTarget(ct,vt,wt),R.setClearColor(q,pt),Kt!==void 0&&(G.viewport=Kt),R.toneMapping=Ot}function Us(y,N,X){const G=N.isScene===!0?N.overrideMaterial:null;for(let k=0,dt=y.length;k<dt;k++){const Et=y[k],{object:ct,geometry:vt,group:wt}=Et;let Ot=Et.material;Ot.allowOverride===!0&&G!==null&&(Ot=G),ct.layers.test(X.layers)&&nl(ct,N,X,vt,Ot,wt)}}function nl(y,N,X,G,k,dt){D!==null&&k.isNodeMaterial&&D.setObject(y,k),y.onBeforeRender(R,N,X,G,k,dt),y.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),k.onBeforeRender(R,N,X,G,y,dt),k.transparent===!0&&k.side===_n&&k.forceSinglePass===!1?(k.side=je,k.needsUpdate=!0,R.renderBufferDirect(X,N,G,k,y,dt),k.side=ti,k.needsUpdate=!0,R.renderBufferDirect(X,N,G,k,y,dt),k.side=_n):R.renderBufferDirect(X,N,G,k,y,dt),y.onAfterRender(R,N,X,G,k,dt)}function il(y){let N=0;for(const X of y)X.texture!==null&&N++;return N}function os(y,N,X){N.isScene!==!0&&(N=hn);const G=Lt.get(y),k=w.state.lights,dt=w.state.shadowsArray,Et=k.state.version,ct=Q.getParameters(y,k.state,dt,N,X,w.state.lightProbeGridArray),vt=Q.getProgramCacheKey(ct);let wt=G.programs;G.environment=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?N.environment:null,G.fog=N.fog;const Ot=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap;G.envMap=A.get(y.envMap||G.environment,Ot),G.envMapRotation=G.environment!==null&&y.envMap===null?N.environmentRotation:y.envMapRotation,wt===void 0&&(y.addEventListener("dispose",se),wt=new Map,G.programs=wt,G.programVariants=new Map);let Kt=wt.get(vt);if(Kt!==void 0){if(G.currentProgram===Kt&&G.lightsStateVersion===Et)return rl(y,ct),Kt}else ct.uniforms=Q.getUniforms(y),D!==null&&y.isNodeMaterial&&D.build(y,X,ct),y.onBeforeCompile(ct,R),Kt=Q.acquireProgram(ct,vt),wt.set(vt,Kt),G.uniforms=ct.uniforms;const Tt=G.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Tt.clippingPlanes=K.uniform),rl(y,ct),G.needsLights=Ru(y),G.lightsStateVersion=Et,G.needsLights&&(Tt.ambientLightColor.value=k.state.ambient,Tt.lightProbe.value=k.state.probe,Tt.sunLights.value=k.state.sun,Tt.sunLightShadows.value=k.state.sunShadow,Tt.directionalLights.value=k.state.directional,Tt.directionalLightShadows.value=k.state.directionalShadow,Tt.spotLights.value=k.state.spot,Tt.spotLightShadows.value=k.state.spotShadow,Tt.rectAreaLights.value=k.state.rectArea,Tt.ltc_1.value=k.state.rectAreaLTC1,Tt.ltc_2.value=k.state.rectAreaLTC2,Tt.pointLights.value=k.state.point,Tt.pointLightShadows.value=k.state.pointShadow,Tt.hemisphereLights.value=k.state.hemi,Tt.sunShadowMatrix.value=k.state.sunShadowMatrix,Tt.sunShadowCascade.value=k.state.sunShadowCascade,Tt.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Tt.spotLightMatrix.value=k.state.spotLightMatrix,Tt.spotLightMap.value=k.state.spotLightMap,Tt.pointShadowMatrix.value=k.state.pointShadowMatrix),G.numLightProbeGrids=il(w.state.lightProbeGridArray),G.currentProgram=Kt,G.uniformsList=null,Kt}function bu(y,N,X,G,k){const dt=Lt.get(y),Et=dt.currentProgram.id+","+G+","+k;let ct=dt.programVariants.get(Et);return ct===void 0?(ct=os(y,N,X),dt.programVariants.set(Et,ct)):(dt.currentProgram=ct,dt.uniformsList=null,dt.outputColorSpace=G,dt.toneMapping=k),ct}function sl(y){if(y.uniformsList===null){const N=y.currentProgram.getUniforms();y.uniformsList=xr.seqWithValue(N.seq,y.uniforms)}return y.uniformsList}function rl(y,N){const X=Lt.get(y);X.outputColorSpace=N.outputColorSpace,X.batching=N.batching,X.batchingColor=N.batchingColor,X.instancing=N.instancing,X.instancingColor=N.instancingColor,X.instancingMorph=N.instancingMorph,X.skinning=N.skinning,X.morphTargets=N.morphTargets,X.morphNormals=N.morphNormals,X.morphColors=N.morphColors,X.morphTargetsCount=N.morphTargetsCount,X.numClippingPlanes=N.numClippingPlanes,X.numIntersection=N.numClipIntersection,X.vertexAlphas=N.vertexAlphas,X.vertexTangents=N.vertexTangents,X.toneMapping=N.toneMapping}function wu(y,N,X,G,k){N.isScene!==!0&&(N=hn),Ut.resetTextureUnits();const dt=N.fog,Et=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?N.environment:null,ct=tt===null?R.outputColorSpace:tt.isXRRenderTarget===!0?tt.texture.colorSpace:Jt.workingColorSpace,vt=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,wt=A.get(G.envMap||Et,vt),Ot=G.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,Kt=!!X.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Tt=!!X.morphAttributes.position,Zt=!!X.morphAttributes.normal,Me=!!X.morphAttributes.color;let ce=Jn;G.toneMapped&&(tt===null||tt.isXRRenderTarget===!0)&&(ce=R.toneMapping);const le=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,ke=le!==void 0?le.length:0,bt=Lt.get(G),Ze=w.state.lights;if(Ee===!0&&(en===!0||y!==J)){const pe=y===J&&G.id===W;K.setState(G,y,pe)}let ee=!1,vi=!1;G.version===bt.__version?bt.needsLights&&bt.lightsStateVersion!==Ze.state.version||k.isBatchedMesh&&bt.batching===!1||!k.isBatchedMesh&&bt.batching===!0||k.isBatchedMesh&&bt.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&bt.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&bt.instancing===!1||!k.isInstancedMesh&&bt.instancing===!0||k.isSkinnedMesh&&bt.skinning===!1||!k.isSkinnedMesh&&bt.skinning===!0||k.isInstancedMesh&&bt.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&bt.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&bt.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&bt.instancingMorph===!1&&k.morphTexture!==null||bt.envMap!==wt||G.fog===!0&&bt.fog!==dt||bt.numClippingPlanes!==void 0&&(bt.numClippingPlanes!==K.numPlanes||bt.numIntersection!==K.numIntersection)||bt.vertexAlphas!==Ot||bt.vertexTangents!==Kt||bt.morphTargets!==Tt||bt.morphNormals!==Zt||bt.morphColors!==Me||bt.morphTargetsCount!==ke||bt.numLightProbeGrids!==il(w.state.lightProbeGridArray)?ee=!0:(bt.outputColorSpace!==ct||bt.toneMapping!==ce)&&(vi=!0):(ee=!0,bt.__version=G.version);let Ve=bt.currentProgram;(ee===!0||vi===!0)&&(Ve=vi===!0?bu(G,N,k,ct,ce):os(G,N,k),D&&G.isNodeMaterial&&D.onUpdateProgram(G,Ve,bt));let Fs=!1,ni=!1,Mi=!1;const jt=Ve.getUniforms(),ze=bt.uniforms;if(mt.useProgram(Ve.program)&&(Fs=!0,ni=!0,Mi=!0),G.id!==W&&(W=G.id,ni=!0),Fs||J!==y){mt.buffers.depth.getReversed()&&y.reversedDepth!==!0&&(y._reversedDepth=!0,y.updateProjectionMatrix()),jt.setValue(U,"projectionMatrix",y.projectionMatrix),jt.setValue(U,"viewMatrix",y.matrixWorldInverse);const Pe=jt.map.cameraPosition;Pe!==void 0&&Pe.setValue(U,Pn.setFromMatrixPosition(y.matrixWorld)),he.logarithmicDepthBuffer&&jt.setValue(U,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&jt.setValue(U,"isOrthographic",y.isOrthographicCamera===!0),J!==y&&(J=y,ni=!0,Mi=!0)}if(bt.needsLights&&(Ze.state.sunShadowMap.length>0&&jt.setValue(U,"sunShadowMap",Ze.state.sunShadowMap,Ut),Ze.state.directionalShadowMap.length>0&&jt.setValue(U,"directionalShadowMap",Ze.state.directionalShadowMap,Ut),Ze.state.spotShadowMap.length>0&&jt.setValue(U,"spotShadowMap",Ze.state.spotShadowMap,Ut),Ze.state.pointShadowMap.length>0&&jt.setValue(U,"pointShadowMap",Ze.state.pointShadowMap,Ut)),k.isSkinnedMesh){jt.setOptional(U,k,"bindMatrix"),jt.setOptional(U,k,"bindMatrixInverse");const pe=k.skeleton;pe&&(pe.boneTexture===null&&pe.computeBoneTexture(),jt.setValue(U,"boneTexture",pe.boneTexture,Ut))}k.isBatchedMesh&&(jt.setOptional(U,k,"batchingTexture"),jt.setValue(U,"batchingTexture",k._matricesTexture,Ut),jt.setOptional(U,k,"batchingIdTexture"),jt.setValue(U,"batchingIdTexture",k._indirectTexture,Ut),jt.setOptional(U,k,"batchingColorTexture"),k._colorsTexture!==null&&jt.setValue(U,"batchingColorTexture",k._colorsTexture,Ut));const vn=X.morphAttributes;if((vn.position!==void 0||vn.normal!==void 0||vn.color!==void 0)&&Z.update(k,X,Ve),(ni||bt.receiveShadow!==k.receiveShadow)&&(bt.receiveShadow=k.receiveShadow,jt.setValue(U,"receiveShadow",k.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&N.environment!==null&&(ze.envMapIntensity.value=N.environmentIntensity),ze.dfgLUT!==void 0&&(ze.dfgLUT.value=Zg()),ni){if(jt.setValue(U,"toneMappingExposure",R.toneMappingExposure),bt.needsLights&&Au(ze,Mi),dt&&G.fog===!0&&rt.refreshFogUniforms(ze,dt),rt.refreshMaterialUniforms(ze,G,ft,Ct,w.state.transmissionRenderTarget[y.id]),bt.needsLights&&bt.numLightProbeGrids>0){const pe=S;let Pe=0;for(const kn of w.state.lightProbeGridArray)kn.texture!==null&&(pe.textures[Pe]=kn.texture,pe.min[Pe]=kn.boundingBox.min,pe.max[Pe]=kn.boundingBox.max,pe.resolution[Pe]=kn.resolution,Pe++);for(const kn in pe)pe[kn].length=Pe;ze.probesSH.value=pe.textures,ze.probesMin.value=pe.min,ze.probesMax.value=pe.max,ze.probesResolution.value=pe.resolution}xr.upload(U,sl(bt),ze,Ut)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(xr.upload(U,sl(bt),ze,Ut),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&jt.setValue(U,"center",k.center),jt.setValue(U,"modelViewMatrix",k.modelViewMatrix),jt.setValue(U,"normalMatrix",k.normalMatrix),jt.setValue(U,"modelMatrix",k.matrixWorld),G.uniformsGroups!==void 0){const pe=G.uniformsGroups;for(let Pe=0,kn=pe.length;Pe<kn;Pe++){const ol=pe[Pe];At.update(ol,Ve),At.bind(ol,Ve)}}return Ve}function Au(y,N){y.ambientLightColor.needsUpdate=N,y.lightProbe.needsUpdate=N,y.sunLights.needsUpdate=N,y.sunLightShadows.needsUpdate=N,y.directionalLights.needsUpdate=N,y.directionalLightShadows.needsUpdate=N,y.pointLights.needsUpdate=N,y.pointLightShadows.needsUpdate=N,y.spotLights.needsUpdate=N,y.spotLightShadows.needsUpdate=N,y.rectAreaLights.needsUpdate=N,y.hemisphereLights.needsUpdate=N}function Ru(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return V},this.getActiveMipmapLevel=function(){return F},this.getRenderTarget=function(){return tt},this.setRenderTargetTextures=function(y,N,X){const G=Lt.get(y);G.__autoAllocateDepthBuffer=y.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),Lt.get(y.texture).__webglTexture=N,Lt.get(y.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:X,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(y,N){const X=Lt.get(y);X.__webglFramebuffer=N,X.__useDefaultFramebuffer=N===void 0},this.setRenderTarget=function(y,N=0,X=0){tt=y,V=N,F=X;let G=null,k=!1,dt=!1;if(y){const ct=Lt.get(y);if(ct.__useDefaultFramebuffer!==void 0){mt.bindFramebuffer(U.FRAMEBUFFER,ct.__webglFramebuffer),j.copy(y.viewport),ut.copy(y.scissor),Rt=y.scissorTest,mt.viewport(j),mt.scissor(ut),mt.setScissorTest(Rt),W=-1;return}else if(ct.__webglFramebuffer===void 0)Ut.setupRenderTarget(y);else if(ct.__hasExternalTextures)Ut.rebindTextures(y,Lt.get(y.texture).__webglTexture,Lt.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){const Ot=y.depthTexture;if(ct.__boundDepthTexture!==Ot){if(Ot!==null&&Lt.has(Ot)&&(y.width!==Ot.image.width||y.height!==Ot.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Ut.setupDepthRenderbuffer(y)}}const vt=y.texture;(vt.isData3DTexture||vt.isDataArrayTexture||vt.isCompressedArrayTexture)&&(dt=!0);const wt=Lt.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(wt[N])?G=wt[N][X]:G=wt[N],k=!0):y.samples>0&&Ut.useMultisampledRTT(y)===!1?G=Lt.get(y).__webglMultisampledFramebuffer:Array.isArray(wt)?G=wt[X]:G=wt,j.copy(y.viewport),ut.copy(y.scissor),Rt=y.scissorTest}else j.copy(It).multiplyScalar(ft).floor(),ut.copy(ie).multiplyScalar(ft).floor(),Rt=oe;if(X!==0&&(G=B),mt.bindFramebuffer(U.FRAMEBUFFER,G)&&mt.drawBuffers(y,G),mt.viewport(j),mt.scissor(ut),mt.setScissorTest(Rt),k){const ct=Lt.get(y.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+N,ct.__webglTexture,X)}else if(dt){const ct=N;for(let vt=0;vt<y.textures.length;vt++){const wt=Lt.get(y.textures[vt]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+vt,wt.__webglTexture,X,ct)}}else if(y!==null&&X!==0){const ct=Lt.get(y.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ct.__webglTexture,X)}W=-1};function al(y){const N=Lt.get(y);return(N.__readFormat!==y.format||N.__readType!==y.type)&&(N.__readFormat=y.format,N.__readType=y.type,N.__formatReadable=he.textureFormatReadable(y.format),N.__typeReadable=he.textureTypeReadable(y.type)),N}this.readRenderTargetPixels=function(y,N,X,G,k,dt,Et,ct=0){if(!(y&&y.isWebGLRenderTarget)){te("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let vt=Lt.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Et!==void 0&&(vt=vt[Et],Array.isArray(vt)&&(vt=vt[0])),vt){mt.bindFramebuffer(U.FRAMEBUFFER,vt);try{const wt=y.textures[ct],Ot=wt.format,Kt=wt.type;y.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ct);const Tt=al(wt);if(Tt.__formatReadable===!1){te("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Tt.__typeReadable===!1){te("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}N>=0&&N<=y.width-G&&X>=0&&X<=y.height-k&&U.readPixels(N,X,G,k,st.convert(Ot),st.convert(Kt),dt)}finally{const wt=tt!==null?Lt.get(tt).__webglFramebuffer:null;mt.bindFramebuffer(U.FRAMEBUFFER,wt)}}},this.readRenderTargetPixelsAsync=async function(y,N,X,G,k,dt,Et,ct=0){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let vt=Lt.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Et!==void 0&&(vt=vt[Et],Array.isArray(vt)&&(vt=vt[0])),vt)if(N>=0&&N<=y.width-G&&X>=0&&X<=y.height-k){mt.bindFramebuffer(U.FRAMEBUFFER,vt);const wt=y.textures[ct],Ot=wt.format,Kt=wt.type;y.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+ct);const Tt=al(wt);if(Tt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Tt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Zt=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,Zt),U.bufferData(U.PIXEL_PACK_BUFFER,dt.byteLength,U.STREAM_READ),U.readPixels(N,X,G,k,st.convert(Ot),st.convert(Kt),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);const Me=tt!==null?Lt.get(tt).__webglFramebuffer:null;mt.bindFramebuffer(U.FRAMEBUFFER,Me);const ce=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await uh(U,ce,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,Zt),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,dt),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(Zt),U.deleteSync(ce),dt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(y,N=null,X=0){const G=Math.pow(2,-X),k=Math.floor(y.image.width*G),dt=Math.floor(y.image.height*G),Et=N!==null?N.x:0,ct=N!==null?N.y:0;Ut.setTexture2D(y,0),U.copyTexSubImage2D(U.TEXTURE_2D,X,0,0,Et,ct,k,dt),mt.unbindTexture()},this.copyTextureToTexture=function(y,N,X=null,G=null,k=0,dt=0){let Et,ct,vt,wt,Ot,Kt,Tt,Zt,Me;const ce=y.isCompressedTexture?y.mipmaps[dt]:y.image;if(X!==null)Et=X.max.x-X.min.x,ct=X.max.y-X.min.y,vt=X.isBox3?X.max.z-X.min.z:1,wt=X.min.x,Ot=X.min.y,Kt=X.isBox3?X.min.z:0;else{const jt=Math.pow(2,-k);Et=Math.floor(ce.width*jt),ct=Math.floor(ce.height*jt),y.isDataArrayTexture?vt=ce.depth:y.isData3DTexture?vt=Math.floor(ce.depth*jt):vt=1,wt=0,Ot=0,Kt=0}G!==null?(Tt=G.x,Zt=G.y,Me=G.z):(Tt=0,Zt=0,Me=0);const le=st.convert(N.format),ke=st.convert(N.type);let bt;N.isData3DTexture?(Ut.setTexture3D(N,0),bt=U.TEXTURE_3D):N.isDataArrayTexture||N.isCompressedArrayTexture?(Ut.setTexture2DArray(N,0),bt=U.TEXTURE_2D_ARRAY):(Ut.setTexture2D(N,0),bt=U.TEXTURE_2D),mt.activeTexture(U.TEXTURE0),mt.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,N.flipY),mt.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,N.premultiplyAlpha),mt.pixelStorei(U.UNPACK_ALIGNMENT,N.unpackAlignment);const Ze=mt.getParameter(U.UNPACK_ROW_LENGTH),ee=mt.getParameter(U.UNPACK_IMAGE_HEIGHT),vi=mt.getParameter(U.UNPACK_SKIP_PIXELS),Ve=mt.getParameter(U.UNPACK_SKIP_ROWS),Fs=mt.getParameter(U.UNPACK_SKIP_IMAGES);mt.pixelStorei(U.UNPACK_ROW_LENGTH,ce.width),mt.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ce.height),mt.pixelStorei(U.UNPACK_SKIP_PIXELS,wt),mt.pixelStorei(U.UNPACK_SKIP_ROWS,Ot),mt.pixelStorei(U.UNPACK_SKIP_IMAGES,Kt);const ni=y.isDataArrayTexture||y.isData3DTexture,Mi=N.isDataArrayTexture||N.isData3DTexture;if(y.isDepthTexture){const jt=Lt.get(y),ze=Lt.get(N),vn=Lt.get(jt.__renderTarget),pe=Lt.get(ze.__renderTarget);mt.bindFramebuffer(U.READ_FRAMEBUFFER,vn.__webglFramebuffer),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,pe.__webglFramebuffer);for(let Pe=0;Pe<vt;Pe++)ni&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Lt.get(y).__webglTexture,k,Kt+Pe),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Lt.get(N).__webglTexture,dt,Me+Pe)),U.blitFramebuffer(wt,Ot,wt+Et,Ot+ct,Tt,Zt,Tt+Et,Zt+ct,U.DEPTH_BUFFER_BIT,U.NEAREST);mt.bindFramebuffer(U.READ_FRAMEBUFFER,null),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(k!==0||y.isRenderTargetTexture||Lt.has(y)){const jt=Lt.get(y),ze=Lt.get(N);mt.bindFramebuffer(U.READ_FRAMEBUFFER,C),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,z);for(let vn=0;vn<vt;vn++)ni?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,jt.__webglTexture,k,Kt+vn):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,jt.__webglTexture,k),Mi?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,ze.__webglTexture,dt,Me+vn):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,ze.__webglTexture,dt),k!==0?U.blitFramebuffer(wt,Ot,wt+Et,Ot+ct,Tt,Zt,Tt+Et,Zt+ct,U.COLOR_BUFFER_BIT,U.NEAREST):Mi?U.copyTexSubImage3D(bt,dt,Tt,Zt,Me+vn,wt,Ot,Et,ct):U.copyTexSubImage2D(bt,dt,Tt,Zt,wt,Ot,Et,ct);mt.bindFramebuffer(U.READ_FRAMEBUFFER,null),mt.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else Mi?y.isDataTexture||y.isData3DTexture?U.texSubImage3D(bt,dt,Tt,Zt,Me,Et,ct,vt,le,ke,ce.data):N.isCompressedArrayTexture?U.compressedTexSubImage3D(bt,dt,Tt,Zt,Me,Et,ct,vt,le,ce.data):U.texSubImage3D(bt,dt,Tt,Zt,Me,Et,ct,vt,le,ke,ce):y.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,dt,Tt,Zt,Et,ct,le,ke,ce.data):y.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,dt,Tt,Zt,ce.width,ce.height,le,ce.data):U.texSubImage2D(U.TEXTURE_2D,dt,Tt,Zt,Et,ct,le,ke,ce);mt.pixelStorei(U.UNPACK_ROW_LENGTH,Ze),mt.pixelStorei(U.UNPACK_IMAGE_HEIGHT,ee),mt.pixelStorei(U.UNPACK_SKIP_PIXELS,vi),mt.pixelStorei(U.UNPACK_SKIP_ROWS,Ve),mt.pixelStorei(U.UNPACK_SKIP_IMAGES,Fs),dt===0&&N.generateMipmaps===!0&&N.mipmapsAutoUpdate===!0&&U.generateMipmap(bt),mt.unbindTexture()},this.initRenderTarget=function(y){Lt.get(y).__webglFramebuffer===void 0&&Ut.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?Ut.setTextureCube(y,0):y.isData3DTexture?Ut.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?Ut.setTexture2DArray(y,0):Ut.setTexture2D(y,0),mt.unbindTexture()},this.resetState=function(){V=0,F=0,tt=null,mt.reset(),at.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return wn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=Jt._getDrawingBufferColorSpace(t),e.unpackColorSpace=Jt._getUnpackColorSpace()}}const vs=6378137,hc=1/298.257222101,de=hc*(2-hc),bi=de/(1-de),wr=.9996,Qg=33,uu=((Qg-1)*6-180+3)*Math.PI/180,hu=5e5,Ar=Math.PI/180;function du(i,t){const e=i*Ar,n=t*Ar,s=Math.sin(e),r=Math.cos(e),a=Math.tan(e),o=vs/Math.sqrt(1-de*s*s),l=a*a,c=bi*r*r,u=r*(n-uu),d=vs*((1-de/4-3*de*de/64-5*de**3/256)*e-(3*de/8+3*de*de/32+45*de**3/1024)*Math.sin(2*e)+(15*de*de/256+45*de**3/1024)*Math.sin(4*e)-35*de**3/3072*Math.sin(6*e)),h=hu+wr*o*(u+(1-l+c)*u**3/6+(5-18*l+l*l+72*c-58*bi)*u**5/120),p=wr*(d+o*a*(u*u/2+(5-l+9*c+4*c*c)*u**4/24+(61-58*l+l*l+600*c-330*bi)*u**6/720));return{x:h,y:p}}function jg(i,t){const e=i-hu,r=t/wr/(vs*(1-de/4-3*de*de/64-5*de**3/256)),a=(1-Math.sqrt(1-de))/(1+Math.sqrt(1-de)),o=r+(3*a/2-27*a**3/32)*Math.sin(2*r)+(21*a*a/16-55*a**4/32)*Math.sin(4*r)+151*a**3/96*Math.sin(6*r)+1097*a**4/512*Math.sin(8*r),l=Math.sin(o),c=Math.cos(o),u=Math.tan(o),d=vs/Math.sqrt(1-de*l*l),h=u*u,p=bi*c*c,_=vs*(1-de)/Math.pow(1-de*l*l,1.5),v=e/(d*wr),m=o-d*u/_*(v*v/2-(5+3*h+10*p-4*p*p-9*bi)*v**4/24+(61+90*h+298*p+45*h*h-252*bi-3*p*p)*v**6/720),f=uu+(v-(1+2*h+p)*v**3/6+(5-2*p+28*h-3*p*p+8*bi+24*h*h)*v**5/120)/c;return{lat:m/Ar,lon:f/Ar}}const qt=(i,t,e)=>Math.max(t,Math.min(e,i)),me=(i,t,e)=>i+(t-i)*e,t0=i=>i*i*(3-2*i),gn=(i,t,e,n)=>me(i,t,1-Math.exp(-e*n)),e0=i=>{for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;return i},Rr=i=>{if(!Number.isFinite(i))return"--:--.---";const t=Math.floor(i/60),e=Math.floor(i%60),n=Math.floor(i%1*1e3);return`${String(t).padStart(2,"0")}:${String(e).padStart(2,"0")}.${String(n).padStart(3,"0")}`},Cr=({lat:i,lon:t})=>`${i.toFixed(5)}, ${t.toFixed(5)}`;function dc(i,t,e=0){let n=Math.imul(i|0,374761393)+Math.imul(t|0,668265263)+Math.imul(e|0,1442695041);return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967296}const De=512,n0=320,i0=-32767;async function s0(i,t){const e=await fetch(i);if(!e.ok)throw new Error(`Could not load ${i} (HTTP ${e.status})`);const n=Number(e.headers.get("content-length"))||0;if(!e.body){const c=await e.arrayBuffer();return t?.(1),c}const s=e.body.getReader(),r=[];let a=0;for(;;){const{done:c,value:u}=await s.read();if(c)break;r.push(u),a+=u.byteLength,n&&t?.(Math.min(.99,a/n))}t?.(1);const o=new Uint8Array(a);let l=0;for(const c of r)o.set(c,l),l+=c.byteLength;return o.buffer}function r0(i,t){const e=i.getFileDirectory?.()||{},n=e.ModelTiepoint,s=e.ModelPixelScale,r=i.getWidth(),a=i.getHeight();let o,l,c,u;if(n&&s&&n.length>=6&&s.length>=3){const d=n[3],h=n[4];o=d,l=d+r*s[0],u=h,c=h-a*s[1]}else if(t?.lat!=null&&t?.lon!=null){const d=du(t.lat,t.lon),h=t.radius||1e3;o=d.x-h,l=d.x+h,c=d.y-h,u=d.y+h}else throw new Error("The GeoTIFF has no georeferencing and scene.json has no centre.");return{width:r,height:a,xMin:o,xMax:l,yMin:c,yMax:u,originX:(o+l)/2,originY:(c+u)/2,sizeX:l-o,sizeZ:u-c}}async function a0({sceneUrl:i,tifUrl:t,onProgress:e,basemapUrl:n=null}){let s=null;try{const T=await fetch(i);T.ok&&(s=await T.json())}catch{s=null}e?.(.05,"Reading elevation model…");const r=await s0(t,T=>{e?.(.05+T*.5,`Loading elevation model… ${Math.round(T*100)}%`)});if(e?.(.6,"Unpacking GeoTIFF…"),!window.GeoTIFF)throw new Error("geotiff.js did not load.");const o=await(await window.GeoTIFF.fromArrayBuffer(r)).getImage(),l=r0(o,s);e?.(.72,"Building terrain grid…");const c=await o.readRasters({width:De,height:De,resampleMethod:"nearest"}),u=new Float32Array(c[0].length);let d=1/0,h=-1/0;for(let T=0;T<u.length;T++){const S=c[0][T],b=S<=i0+100||!Number.isFinite(S)?0:Math.max(0,S);u[T]=b,b<d&&(d=b),b>h&&(h=b)}const p=l.sizeX,_=l.sizeZ,v=p/(De-1),m=_/(De-1),f=u.slice(),M={scene:s,meta:l,heights:u,basemapUrl:n,grid:De,sizeX:p,sizeZ:_,minH:d,maxH:h,cellX:v,cellZ:m,originX:l.originX,originY:l.originY,worldFromUtm(T,S){return{x:T-l.originX,z:-(S-l.originY)}},utmFromWorld(T,S){return{x:T+l.originX,y:l.originY-S}},worldFromLatLon(T,S){const{x:b,y:w}=du(T,S);return{x:b-l.originX,z:-(w-l.originY)}},latLonFromWorld(T,S){return jg(T+l.originX,l.originY-S)},inside(T,S,b=0){return Math.abs(T)<=p/2-b&&Math.abs(S)<=_/2-b},sample(T,S){const b=(T+p/2)/p*(De-1),w=(S+_/2)/_*(De-1),g=qt(Math.floor(b),0,De-2),E=qt(Math.floor(w),0,De-2),I=qt(b-g,0,1),R=qt(w-E,0,1),L=u[E*De+g],D=u[E*De+g+1],B=u[(E+1)*De+g],C=u[(E+1)*De+g+1];return me(me(L,D,I),me(B,C,I),R)},gradient(T,S,b=4){const w=(this.sample(T+b,S)-this.sample(T-b,S))/(2*b),g=(this.sample(T,S+b)-this.sample(T,S-b))/(2*b);return{gx:w,gz:g}},slope(T,S){const{gx:b,gz:w}=this.gradient(T,S);return Math.hypot(b,w)},normal(T,S,b=5){const{gx:w,gz:g}=this.gradient(T,S,b);return new O(-w,1,-g).normalize()},resetHeights(){u.set(f)},flattenPad(T,S,b=18,w=34,g=null){const E=g??this.sample(T,S),I=p/2,R=_/2,L=b+w;for(let D=0;D<De;D++){const B=-R+D/(De-1)*_;if(!(Math.abs(B-S)>L))for(let C=0;C<De;C++){const z=-I+C/(De-1)*p,V=Math.hypot(z-T,B-S);if(V>L)continue;const F=V<=b?1:1-t0((V-b)/w),tt=D*De+C;u[tt]=me(f[tt],E,F)}}return E}};return e?.(.85,"Growing trees…"),M}function fu(i,t,e,n,s){const r=dc(Math.floor(e*.25),Math.floor(n*.25),91),a=dc(Math.floor(e*.08),Math.floor(n*.08),17);let o,l,c;if(i<1.2)o=.19,l=.32,c=.34;else if(i<40)o=.24,l=.34,c=.22;else if(i<190){const v=(i-40)/150;o=me(.23,.28,v),l=me(.35,.39,v),c=me(.2,.21,v)}else if(i<430){const v=(i-190)/240;o=me(.28,.33,v),l=me(.39,.4,v),c=me(.21,.22,v)}else if(i<575){const v=(i-430)/145;o=me(.33,.4,v),l=me(.4,.39,v),c=me(.22,.25,v)}else if(i<665){const v=(i-575)/90;o=me(.4,.47,v),l=me(.39,.45,v),c=me(.25,.39,v)}else{const v=qt((i-665)/70,0,1);o=me(.47,.62,v),l=me(.45,.6,v),c=me(.39,.54,v)}const u=qt((t-.55)*2.2,0,1),d=.34+a*.14,h=.33+a*.13,p=.3+a*.13;o=me(o,d,u),l=me(l,h,u),c=me(c,p,u);const _=(r-.5)*.062;s.setRGB(qt(o+_,0,1),qt(l+_*1.1,0,1),qt(c+_*.55,0,1))}function o0(i){const t=i.grid,e=new tn,n=new Float32Array(t*t*3),s=new Float32Array(t*t*3),r=new Float32Array(t*t*2),a=new Dt,o=i.sizeX/2,l=i.sizeZ/2;for(let f=0;f<t;f++){const M=-l+f/(t-1)*i.sizeZ;for(let T=0;T<t;T++){const S=-o+T/(t-1)*i.sizeX,b=f*t+T,w=i.heights[b];n[b*3]=S,n[b*3+1]=w,n[b*3+2]=M,r[b*2]=T/(t-1),r[b*2+1]=1-f/(t-1);const g=i.slope(S,M);fu(w,g,S,M,a),s[b*3]=a.r,s[b*3+1]=a.g,s[b*3+2]=a.b}}const c=new Uint32Array((t-1)*(t-1)*6);let u=0;for(let f=0;f<t-1;f++)for(let M=0;M<t-1;M++){const T=f*t+M,S=T+1,b=T+t,w=b+1;c[u++]=T,c[u++]=b,c[u++]=S,c[u++]=S,c[u++]=b,c[u++]=w}e.setAttribute("position",new Ue(n,3)),e.setAttribute("color",new Ue(s,3)),e.setAttribute("uv",new Ue(r,2)),e.setIndex(new Ue(c,1)),e.computeVertexNormals(),e.computeBoundingSphere();const d=new $e({vertexColors:!0,flatShading:!0}),h=new Xt(e,d);h.receiveShadow=!0,h.castShadow=!0,h.name="terrain",h.userData.terrain=i;const p=new cn,_=new $e({color:2435880}),v=Math.max(60,i.minH+80),m=(f,M,T,S)=>{const b=new xn(f,v,1,1),w=new Xt(b,_);w.rotation.y=S,w.position.set(M,-v/2-5,T),w.receiveShadow=!0,p.add(w)};return m(i.sizeX,0,-l,0),m(i.sizeX,0,l,Math.PI),m(i.sizeZ,-o,0,Math.PI/2),m(i.sizeZ,o,0,-Math.PI/2),h.add(p),h}async function l0(i){if(!i)return null;try{const t=await new Kh().loadAsync(i);return t.colorSpace=Ye,t.anisotropy=8,t.minFilter=Zn,t.magFilter=Qe,t.needsUpdate=!0,t}catch(t){return console.warn("Basemap could not be loaded:",i,t),null}}function c0(i,t){const e=i.grid,n=new tn,s=new Float32Array(e*e*3),r=new Float32Array(e*e*2),a=i.sizeX/2,o=i.sizeZ/2;for(let h=0;h<e;h++){const p=-o+h/(e-1)*i.sizeZ;for(let _=0;_<e;_++){const v=h*e+_;s[v*3]=-a+_/(e-1)*i.sizeX,s[v*3+1]=i.heights[v],s[v*3+2]=p,r[v*2]=_/(e-1),r[v*2+1]=1-h/(e-1)}}const l=new Uint32Array((e-1)*(e-1)*6);let c=0;for(let h=0;h<e-1;h++)for(let p=0;p<e-1;p++){const _=h*e+p,v=_+1,m=_+e,f=m+1;l[c++]=_,l[c++]=m,l[c++]=v,l[c++]=v,l[c++]=m,l[c++]=f}n.setAttribute("position",new Ue(s,3)),n.setAttribute("uv",new Ue(r,2)),n.setIndex(new Ue(l,1)),n.computeBoundingSphere();const u=new sn({map:t,toneMapped:!1,fog:!1,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),d=new Xt(n,u);return d.name="basemap",d.renderOrder=1,d.receiveShadow=!1,d.castShadow=!1,d.visible=!1,d}function u0(i){const t=new xn(9e3,9e3,48,48);t.rotateX(-Math.PI/2);const e=t.attributes.position.array.slice(),n=new Gn({transparent:!0,depthWrite:!1,uniforms:{uTime:{value:0},uDeep:{value:new Dt(1527395)},uShallow:{value:new Dt(4034211)},uSun:{value:new O(.45,.75,.3).normalize()},fogColor:{value:new Dt(12572900)},fogNear:{value:400},fogFar:{value:2600}},vertexShader:`
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
    `}),s=new Xt(t,n);return s.position.y=.45,s.renderOrder=2,s.frustumCulled=!1,s.userData.basePositions=e,s.userData.material=n,s}function h0(i,t,e=Math.random){const n=new cn,s=i.sizeX/2-25,r=i.sizeZ/2-25,a=1500,o=260,l=new Cn(.22,.32,2.2,5),c=new Or(1.7,5.2,5),u=new Do(1,0),d=new $e({color:4863269,flatShading:!0}),h=new $e({color:3099442,flatShading:!0}),p=new $e({color:7827561,flatShading:!0}),_=new _r(l,d,a),v=new _r(c,h,a),m=new _r(u,p,o);_.castShadow=!0,v.castShadow=!0,v.receiveShadow=!0,m.castShadow=!0,m.receiveShadow=!0;const f=new ne,M=new On,T=new O,S=new O,b=new Dt;let w=0,g=0;for(;w<a&&g<a*26;){g++;const I=(e()*2-1)*s,R=(e()*2-1)*r,L=i.sample(I,R);if(L<12||L>625||i.slope(I,R)>.62||t&&t.distanceTo(I,R)<9)continue;const B=.55+e()*.95,C=e()*Math.PI*2;M.setFromAxisAngle(new O(0,1,0),C),T.set(I,L+1.1*B,R),S.set(B,B,B),f.compose(T,M,S),_.setMatrixAt(w,f),T.set(I,L+4.1*B,R),f.compose(T,M,S),v.setMatrixAt(w,f),b.setHSL(.31+e()*.035,.27+e()*.16,.18+e()*.1),v.setColorAt(w,b),w++}_.count=w,v.count=w;let E=0;for(g=0;E<o&&g<o*24;){g++;const I=(e()*2-1)*s,R=(e()*2-1)*r,L=i.sample(I,R);if(L<2||L>690||t&&t.distanceTo(I,R)<8)continue;const D=.5+e()*2.4,B=e()*Math.PI*2;M.setFromAxisAngle(new O(0,1,0),B),T.set(I,L+D*.32,R),S.set(D*(.8+e()*.5),D*(.55+e()*.35),D*(.8+e()*.4)),f.compose(T,M,S),m.setMatrixAt(E++,f)}return m.count=E,_.instanceMatrix&&(_.instanceMatrix.needsUpdate=!0),v.instanceMatrix&&(v.instanceMatrix.needsUpdate=!0),v.instanceColor&&(v.instanceColor.needsUpdate=!0),m.instanceMatrix&&(m.instanceMatrix.needsUpdate=!0),n.add(_,v,m),n.name="vegetation",n}function d0(i,t=null){const e=document.createElement("canvas"),n=n0;e.width=n,e.height=n;const s=e.getContext("2d");if(t)return s.drawImage(t,0,0,n,n),e;const r=s.createImageData(n,n);i.grid;const a=new Dt;for(let o=0;o<n;o++)for(let l=0;l<n;l++){const c=(l/(n-1)-.5)*i.sizeX,u=(o/(n-1)-.5)*i.sizeZ,d=i.sample(c,u),h=i.slope(c,u);fu(d,h,c,u,a);const p=i.sizeX/n,_=(i.sample(c+p,u)-i.sample(c-p,u))/(2*p),v=(i.sample(c,u+p)-i.sample(c,u-p))/(2*p),m=qt(.72+(-_*.7-v*.7)*1.2,.38,1.2),f=(o*n+l)*4;r.data[f]=qt(a.r*255*m,0,255),r.data[f+1]=qt(a.g*255*m,0,255),r.data[f+2]=qt(a.b*255*m,0,255),r.data[f+3]=255}return s.putImageData(r,0,0),e}class f0{constructor(){this.items=[]}get size(){return this.items.length}push(t,e){const n={priority:t,value:e},s=this.items;s.push(n);let r=s.length-1;for(;r>0;){const a=r-1>>1;if(s[a].priority<=s[r].priority)break;[s[a],s[r]]=[s[r],s[a]],r=a}}pop(){const t=this.items;if(!t.length)return null;const e=t[0],n=t.pop();if(t.length){t[0]=n;let s=0;for(;;){const r=s*2+1,a=r+1;let o=s;if(r<t.length&&t[r].priority<t[o].priority&&(o=r),a<t.length&&t[a].priority<t[o].priority&&(o=a),o===s)break;[t[o],t[s]]=[t[s],t[o]],s=o}}return e.value}}class p0{constructor(t,e,{name:n="Rally stage",source:s="generated",roadWidth:r=4.2}={}){this.terrain=e,this.name=n,this.source=s,this.roadWidth=r,this.points=t,this.samples=this.prepareSamples(t),this.length=this.samples[this.samples.length-1]?.s||0,this.start=this.samples[0],this.finish=this.samples[this.samples.length-1]}prepareSamples(t){const e=[];let n=0;for(let s=0;s<t.length;s++){const r=t[s];if(s>0){const a=t[s-1];n+=Math.hypot(r.x-a.x,r.z-a.z)}e.push({x:r.x,z:r.z,y:this.terrain.sample(r.x,r.z),s:n})}return e}at(t){return this.samples[qt(t,0,this.samples.length-1)]}snapToTerrain(){let t=0;for(let e=0;e<this.samples.length;e++){const n=this.samples[e];if(e>0){const s=this.samples[e-1];t+=Math.hypot(n.x-s.x,n.z-s.z)}n.y=this.terrain.sample(n.x,n.z),n.s=t}return this.length=t,this.start=this.samples[0],this.finish=this.samples[this.samples.length-1],this}nearest(t,e){let n=1/0,s=0;const r=this.samples;for(let h=0;h<r.length;h++){const p=r[h].x-t,_=r[h].z-e,v=p*p+_*_;v<n&&(n=v,s=h)}const a=r[s],o=r[Math.min(s+1,r.length-1)],l=r[Math.max(s-1,0)];let c=o.x-l.x,u=o.z-l.z;const d=Math.hypot(c,u)||1;return c/=d,u/=d,{distance:Math.sqrt(n),index:s,progress:this.length>0?a.s/this.length:0,point:a,tangent:{x:c,z:u}}}distanceTo(t,e){return this.nearest(t,e).distance}sampleAtDistance(t){const e=qt(t,0,this.length);let n=0,s=this.samples.length-1;for(;n<s-1;){const l=n+s>>1;this.samples[l].s<e?n=l:s=l}const r=this.samples[n],a=this.samples[s],o=(e-r.s)/Math.max(1e-4,a.s-r.s);return{x:r.x+(a.x-r.x)*o,z:r.z+(a.z-r.z)*o,y:r.y+(a.y-r.y)*o,angle:Math.atan2(a.x-r.x,a.z-r.z)}}startPose(){const t=this.samples[0],e=this.samples[Math.min(4,this.samples.length-1)];return{x:t.x,z:t.z,y:this.terrain.sample(t.x,t.z),yaw:Math.atan2(e.x-t.x,e.z-t.z)}}}function m0(i,t=2){let e=i.map(n=>({x:n.x,z:n.z}));for(let n=0;n<t&&!(e.length<3);n++){const s=[e[0]];for(let r=0;r<e.length-1;r++){const a=e[r],o=e[r+1];s.push({x:a.x*.75+o.x*.25,z:a.z*.75+o.z*.25}),s.push({x:a.x*.25+o.x*.75,z:a.z*.25+o.z*.75})}s.push(e[e.length-1]),e=s}return e}function g0(i,t){if(i.length<2)return i;const e=[{x:i[0].x,z:i[0].z}];let n=0;for(let r=1;r<i.length;r++){const a=i[r-1],o=i[r],l=o.x-a.x,c=o.z-a.z,u=Math.hypot(l,c);if(u<1e-4)continue;let d=(t-n)/u;for(;d<=1;)e.push({x:a.x+l*d,z:a.z+c*d}),d+=t/u;n=(n+u)%t}const s=i[i.length-1];return Math.hypot(s.x-e[e.length-1].x,s.z-e[e.length-1].z)>1&&e.push({x:s.x,z:s.z}),e}function _0(i,t=2.5){if(i.length<3)return i;const e=t*t,n=new Uint8Array(i.length);n[0]=1,n[i.length-1]=1;const s=[[0,i.length-1]];for(;s.length;){const[r,a]=s.pop();let o=0,l=-1;const c=i[r],u=i[a],d=u.x-c.x,h=u.z-c.z,p=d*d+h*h;for(let _=r+1;_<a;_++){const v=i[_];let m;if(p===0)m=(v.x-c.x)**2+(v.z-c.z)**2;else{const f=qt(((v.x-c.x)*d+(v.z-c.z)*h)/p,0,1);m=(v.x-(c.x+d*f))**2+(v.z-(c.z+h*f))**2}m>o&&(o=m,l=_)}o>e&&l>0&&(n[l]=1,s.push([r,l],[l,a]))}return i.filter((r,a)=>n[a])}function pu(i,t,e={}){const n=e.smooth??2,s=e.spacing??4,r=e.simplify===!1?i:_0(i,e.simplifyEpsilon??2.5),a=m0(r,n),o=g0(a,s);return new p0(o,t,e)}function x0(i,t=248){const e=i.sizeX/t,n=t+1,s=new Float32Array(n*n),r=new Float32Array(n*n);for(let a=0;a<n;a++){const o=-i.sizeZ/2+a/t*i.sizeZ;for(let l=0;l<n;l++){const c=-i.sizeX/2+l/t*i.sizeX;s[a*n+l]=i.sample(c,o)}}for(let a=0;a<n;a++)for(let o=0;o<n;o++){const l=Math.max(0,o-1),c=Math.min(n-1,o+1),u=Math.max(0,a-1),d=Math.min(n-1,a+1),h=(s[a*n+c]-s[a*n+l])/((c-l)*e),p=(s[d*n+o]-s[u*n+o])/((d-u)*e);r[a*n+o]=Math.hypot(h,p)}return{cell:e,n,heights:s,slopes:r}}function fc(i,t,e,n=55){let s={x:t,z:e,slope:i.slope(t,e),score:i.slope(t,e)};for(let r=0;r<=n;r+=4){const a=r===0?1:20;for(let o=0;o<a;o++){const l=o/a*Math.PI*2,c=t+Math.cos(l)*r,u=e+Math.sin(l)*r;if(!i.inside(c,u,20)||i.sample(c,u)<6)continue;const d=i.slope(c,u),h=d+r/Math.max(1,n)*.11;h<s.score&&(s={x:c,z:u,slope:d,score:h})}}return{x:s.x,z:s.z,slope:s.slope}}function Cs(i,t,e,{name:n="Rally stage",cells:s=248,maxSlope:r=.78}={}){t=fc(i,t.x,t.z,65),e=fc(i,e.x,e.z,24);const a=x0(i,s),{cell:o,n:l,heights:c,slopes:u}=a,d=(L,D)=>({i:qt(Math.round((L+i.sizeX/2)/o),0,l-1),j:qt(Math.round((D+i.sizeZ/2)/o),0,l-1)}),h=(L,D)=>{for(let B=0;B<=40;B++){let C=-1,z=1/0;for(let V=-B;V<=B;V++)for(let F=-B;F<=B;F++){if(Math.max(Math.abs(F),Math.abs(V))!==B)continue;const tt=L+F,W=D+V;if(tt<0||W<0||tt>=l||W>=l)continue;const J=W*l+tt;if(c[J]<1.5||u[J]>r)continue;const j=F*F+V*V;j<z&&(z=j,C=J)}if(C>=0)return C}return-1},p=d(t.x,t.z),_=d(e.x,e.z),v=h(p.i,p.j),m=h(_.i,_.j);if(v<0||m<0)throw new Error("No gentle, dry ground near one of those points. Pick a spot further from the cliff edge.");if(v===m)throw new Error("Those two points are practically the same place. Pick a finish further away.");const f=l*l,M=new Float32Array(f).fill(1/0),T=new Int32Array(f).fill(-1),S=new Uint8Array(f),b=new f0;M[v]=0,b.push(0,v);const w=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,Math.SQRT2],[-1,1,Math.SQRT2],[1,-1,Math.SQRT2],[-1,-1,Math.SQRT2]];let g=0,E=!1;for(;b.size&&g++<24e4;){const L=b.pop();if(S[L])continue;if(S[L]=1,L===m){E=!0;break}const D=L%l,B=L/l|0;for(const[C,z,V]of w){const F=D+C,tt=B+z;if(F<0||tt<0||F>=l||tt>=l)continue;const W=tt*l+F;if(S[W])continue;const J=c[W];if(J<1.5)continue;const j=u[W];if(j>r)continue;let ut=1+j*j*13+(j>.34?9:0)+(j>.58?22:0);J>640&&(ut+=4);const Rt=V*o*ut,q=M[L]+Rt;if(q<M[W]){M[W]=q,T[W]=L;const pt=F-_.i,St=tt-_.j,Ct=Math.hypot(pt,St)*o;b.push(q+Ct,W)}}}if(!E)throw new Error("No drivable link between those points. Try two spots on gentler ground.");const I=[];let R=m;for(;R>=0;){const L=R%l,D=R/l|0;I.push({x:-i.sizeX/2+L*o,z:-i.sizeZ/2+D*o}),R=T[R]}return I.reverse(),pu(I,i,{name:n,source:"generated",smooth:3,spacing:4,simplifyEpsilon:2.2,roadWidth:4.2})}const pc=["Preikestolen Climb","Fjord Rim Special","Nervevarden Pass","Hengjane Hairpins","Lysefjord Drop","Neravadalen Sprint","The Pulpit Run","Kjerag Approach"];function v0(i,t=Math.random){const e=i.sizeX/2-120,n=i.sizeZ/2-120;let s=null;for(let r=0;r<34;r++){const a={x:(t()*2-1)*e,z:(t()*2-1)*n},o=i.sample(a.x,a.z);if(o<120||o>610||i.slope(a.x,a.z)>.42)continue;const l=t()*Math.PI*2,c=700+t()*750,u={x:qt(a.x+Math.cos(l)*c,-e,e),z:qt(a.z+Math.sin(l)*c,-n,n)},d=i.sample(u.x,u.z);if(!(d<80||d>620||i.slope(u.x,u.z)>.42))try{const h=Cs(i,a,u,{name:pc[Math.floor(t()*pc.length)]});if(h.length>650&&h.length<4200)return h;s=h}catch{}}return s||Cs(i,{x:-710,z:288},{x:104,z:-245},{name:"Preikestolen Climb"})}const mc={driving:"https://router.project-osrm.org/route/v1/driving",foot:"https://routing.openstreetmap.de/routed-foot/route/v1/foot",cycling:"https://routing.openstreetmap.de/routed-bike/route/v1/bike"};function M0(i,t){const n=(t.lat-i.lat)*Math.PI/180,s=(t.lon-i.lon)*Math.PI/180,r=i.lat*Math.PI/180,a=t.lat*Math.PI/180,o=Math.sin(n/2)**2+Math.cos(r)*Math.cos(a)*Math.sin(s/2)**2;return 2*6371e3*Math.asin(Math.min(1,Math.sqrt(o)))}async function Bo(i,{a:t,b:e,profile:n="driving"}){const r=`${mc[n]||mc.driving}/${t.lon},${t.lat};${e.lon},${e.lat}?overview=full&geometries=geojson&steps=false`;let a;const o=new AbortController,l=setTimeout(()=>o.abort(),12e3);try{a=await fetch(r,{signal:o.signal})}catch(S){throw S.name==="AbortError"?new Error("OSRM took too long to answer. Use OFF-ROAD ROUTE, or try again."):new Error("OSRM could not be reached. Check the connection, or use OFF-ROAD ROUTE.")}finally{clearTimeout(l)}if(!a.ok)throw new Error(`OSRM did not answer (HTTP ${a.status}).`);const c=await a.json();if(c.code!=="Ok"||!c.routes?.length)throw new Error(c.message||"OSRM found no route between those coordinates.");const u=c.routes[0],d=c.waypoints?.[0]?.distance??null,h=c.waypoints?.[1]?.distance??null,p=d!=null&&h!=null?` Snapped ${Math.round(d)} m / ${Math.round(h)} m from the picked points.`:"",_=M0(t,e);if(u.distance<25||_>80&&u.distance<_*.35)throw new Error(`OSRM snapped both points to the same road or trail (${Math.round(u.distance)} m route for a ${Math.round(_)} m gap).${p} Pick points on a mapped road/trail, or use OFF-ROAD ROUTE.`);const v=n==="driving"?400:750;if(d!=null&&d>v||h!=null&&h>v)throw new Error(`OSRM snapped a point ${Math.round(Math.max(d??0,h??0))} m away from where you picked, too far to make a fair stage.${p} Pick points nearer to a mapped road/trail, or use OFF-ROAD ROUTE.`);const m=u.geometry.coordinates,f=[];let M=0;for(const[S,b]of m){const w=i.worldFromLatLon(b,S);i.inside(w.x,w.z,4)||M++,f.push(w)}if(M>0)throw new Error(`That road leaves the 2 km demo terrain (${M} of ${f.length} points outside). Pick start and finish inside the Preikestolen tile.`);if(f.length<2)throw new Error("OSRM returned an empty geometry.");const T=pu(f,i,{name:`${n==="foot"?"Footpath":n==="cycling"?"Bike trail":"OSRM road"} stage`,source:"osrm",smooth:1,spacing:5,simplifyEpsilon:2,roadWidth:n==="driving"?4.8:3.4});if(T.length<20)throw new Error(`That road is too short to make a stage (${Math.round(T.length)} m).${p}`);return{route:T,distance:u.distance,duration:u.duration,profile:n,snapped:{a:d,b:h}}}function S0(i,t="#f2c14e"){const e=document.createElement("canvas");e.width=1024,e.height=192;const n=e.getContext("2d");n.fillStyle="rgba(18,22,20,0.92)",n.fillRect(0,0,e.width,e.height),n.strokeStyle=t,n.lineWidth=10,n.strokeRect(8,8,e.width-16,e.height-16),n.fillStyle=t,n.font='bold 112px "Arial Black", Impact, sans-serif',n.textAlign="center",n.textBaseline="middle",n.fillText(i,e.width/2,e.height/2+6);const s=new Fr(e);return s.colorSpace=Ye,s}function y0(){const i=document.createElement("canvas");i.width=128,i.height=32;const t=i.getContext("2d");for(let n=0;n<4;n++)for(let s=0;s<16;s++)t.fillStyle=(s+n)%2?"#131716":"#e8e7db",t.fillRect(s*8,n*8,8,8);const e=new Fr(i);return e.colorSpace=Ye,e.magFilter=ye,e}function gc(i,t,e){const n=e?Math.min(3,i.samples.length-1):Math.max(0,i.samples.length-1),s=i.samples[n],r=e?i.samples[Math.min(n+3,i.samples.length-1)]:i.samples[Math.max(0,n-3)],a=Math.atan2(r.x-s.x,r.z-s.z),o=new cn;o.position.set(s.x,t.sample(s.x,s.z)+.1,s.z),o.rotation.y=a;const l=i.roadWidth*2+2.6,c=new $e({color:e?3116891:13193021}),u=new Cn(.22,.28,5.4,6);for(const f of[-l/2,l/2]){const M=new Xt(u,c);M.position.set(f,2.7,0),M.castShadow=!0,o.add(M)}const d=new Xt(new nn(l+.7,.45,.5),new $e({color:e?3116891:13193021}));d.position.y=5.25,d.castShadow=!0,o.add(d);const h=S0(e?"START":"FINISH",e?"#7fe6a8":"#ffd75e"),p=new xn(l*.86,1.55),_=new Xt(p,new sn({map:h,side:ti,toneMapped:!1}));_.position.set(0,4.35,.03);const v=new Xt(p,new sn({map:h,side:ti,toneMapped:!1}));v.position.set(0,4.35,-.03),v.rotation.y=Math.PI,o.add(_,v);const m=new Xt(new xn(l,2.8),new sn({map:y0(),side:_n,toneMapped:!1,polygonOffset:!0,polygonOffsetFactor:-4}));return m.rotation.x=-Math.PI/2,m.position.y=.3,o.add(m),o.userData.line=m,o}function E0(i,t){const e=i.samples,n=e.length,s=i.roadWidth,r=.9,a=new Float32Array(n*4*3),o=new Float32Array(n*4*3),l=[],c=new Dt(8222569),u=new Dt(6446418),d=new Dt(5067078),h=new Dt(9406583),p=new Dt;for(let D=0;D<n;D++){const B=e[D],C=e[Math.max(0,D-1)],z=e[Math.min(n-1,D+1)];let V=z.x-C.x,F=z.z-C.z;const tt=Math.hypot(V,F)||1;V/=tt,F/=tt;const W=-F,J=V,j=D<3||D>n-4?1:.55;for(let ut=0;ut<4;ut++){const Rt=ut===0?-(s+r):ut===1?-s:ut===2?s:s+r,q=B.x+W*Rt,pt=B.z+J*Rt,St=t.sample(q,pt),Ct=ut===1||ut===2?.06:0,ft=(D*4+ut)*3;a[ft]=q,a[ft+1]=St+.15+Ct,a[ft+2]=pt,ut===0||ut===3?p.copy(d):D%17===0?p.copy(h):p.copy(D%5===0?u:c),p.multiplyScalar(.92+j*.08),o[ft]=p.r,o[ft+1]=p.g,o[ft+2]=p.b}if(D<n-1){const ut=D*4,Rt=(D+1)*4;for(let q=0;q<3;q++)l.push(ut+q,Rt+q,ut+q+1),l.push(ut+q+1,Rt+q,Rt+q+1)}}const _=new tn;_.setAttribute("position",new Ue(a,3)),_.setAttribute("color",new Ue(o,3)),_.setIndex(l),_.computeVertexNormals();const v=new $e({vertexColors:!0,flatShading:!0,side:_n,polygonOffset:!0,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),m=new Xt(_,v);m.receiveShadow=!0,m.castShadow=!1,m.name="road";const f=new cn;f.add(m);const M=new Cn(.065,.085,1.15,5),T=new sn({color:16052193}),S=new sn({color:13581874}),b=[],w=26;for(let D=18;D<i.length-12;D+=w){const B=i.sampleAtDistance(D),C=i.sampleAtDistance(D-3),z=i.sampleAtDistance(D+3),V=z.x-C.x,F=z.z-C.z,tt=Math.hypot(V,F)||1,W=-F/tt,J=V/tt,j=Math.round(D/w)%2?1:-1,ut=B.x+W*(s+1.2)*j,Rt=B.z+J*(s+1.2)*j;b.push({x:ut,z:Rt,y:t.sample(ut,Rt)+.55,red:j>0})}const g=b.filter(D=>!D.red),E=b.filter(D=>D.red),I=(D,B)=>{const C=new _r(M,B,Math.max(1,D.length)),z=new ne;return D.forEach((V,F)=>{z.makeTranslation(V.x,V.y,V.z),C.setMatrixAt(F,z)}),C.count=D.length,C.instanceMatrix.needsUpdate=!0,C};f.add(I(g,T),I(E,S));const R=gc(i,t,!0),L=gc(i,t,!1);return f.add(R,L),f.userData.startGate=R,f.userData.finishGate=L,f}const lr=1.58,Ma=.38;function T0(i){const t=document.createElement("canvas");t.width=128,t.height=128;const e=t.getContext("2d");e.fillStyle="#f1ead8",e.fillRect(0,0,128,128),e.strokeStyle="#1b1e1c",e.lineWidth=6,e.strokeRect(3,3,122,122),e.fillStyle="#1b1e1c",e.font='bold 88px "Arial Black", Impact, sans-serif',e.textAlign="center",e.textBaseline="middle",e.fillText(i,64,70);const n=new Fr(t);return n.colorSpace=Ye,n}class b0{constructor(t,e){this.scene=t,this.terrain=e,this.route=null,this.roadQuery=null,this.pos=new O(0,0,0),this.vel=new Gt(0,0),this.yaw=0,this.yawVel=0,this.verticalVel=0,this.grounded=!0,this.steer=0,this.steerVisual=0,this.vF=0,this.vR=0,this.speed=0,this.onRoad=!1,this.drifting=!1,this.airTime=0,this.distance=0,this.wrongWay=!1,this.pitch=0,this.roll=0,this.bodyRoll=0,this.wheelSpin=0,this.group=new cn,this.group.name="car",this.buildModel(),t.add(this.group),this.dust=this.createDust(),t.add(this.dust.points)}buildModel(){const t=this.group,e=new $e({color:13847089,flatShading:!0}),n=new $e({color:10366754,flatShading:!0}),s=new $e({color:15985368,flatShading:!0}),r=new $e({color:1912633,flatShading:!0}),a=new $e({color:1514009,flatShading:!0}),o=new $e({color:14144195,flatShading:!0}),l=new sn({color:16771496,toneMapped:!1}),c=new sn({color:16726570,toneMapped:!1}),u=new Xt(new nn(1.74,.48,4),e);u.position.y=.68,u.castShadow=!0,u.receiveShadow=!0,t.add(u);const d=new Xt(new nn(1.68,.34,.55),n);d.position.set(0,.58,2.06),d.castShadow=!0,t.add(d);const h=new Xt(new nn(1.48,.58,1.85),r);h.position.set(0,1.14,-.18),h.castShadow=!0,t.add(h);const p=new Xt(new nn(1.42,.14,1.55),s);p.position.set(0,1.47,-.23),p.castShadow=!0,t.add(p);const _=new Xt(new xn(.72,.72),new sn({map:T0("37"),toneMapped:!1}));_.rotation.x=-Math.PI/2,_.position.set(.28,1.545,-.22),t.add(_);for(const L of[-.72,.72]){const D=new Xt(new nn(.34,.2,.06),l);D.position.set(L,.7,2.02+.02),t.add(D);const B=new Xt(new nn(.28,.18,.06),c);B.position.set(L,.72,-2.02),t.add(B)}const v=new Xt(new nn(1.78,.15,.18),a);v.position.set(0,.42,2.1),t.add(v);const m=v.clone();m.position.z=-2.1,t.add(m);const f=new Xt(new nn(.38,.03,4.02),s);f.position.set(0,.94,0),t.add(f);const M=new Xt(new Cn(.06,.06,.32,6),o);M.rotation.x=Math.PI/2,M.position.set(-.55,.34,-2.1),t.add(M),this.wheels=[];const T=new Cn(Ma,Ma,.3,10);T.rotateZ(Math.PI/2);const S=new Cn(.19,.19,.32,8);S.rotateZ(Math.PI/2);const b=[[-lr/2,.38,1.34,!0],[lr/2,.38,1.34,!0],[-lr/2,.38,-1.32,!1],[lr/2,.38,-1.32,!1]];for(const[L,D,B,C]of b){const z=new cn;z.position.set(L,D,B);const V=new cn,F=new Xt(T,a);F.castShadow=!0;const tt=new Xt(S,o);V.add(F,tt),z.add(V),t.add(z),this.wheels.push({pivot:z,spin:V,front:C})}const w=document.createElement("canvas");w.width=128,w.height=128;const g=w.getContext("2d"),E=g.createRadialGradient(64,64,8,64,64,62);E.addColorStop(0,"rgba(0,0,0,0.55)"),E.addColorStop(1,"rgba(0,0,0,0)"),g.fillStyle=E,g.fillRect(0,0,128,128);const I=new Fr(w),R=new Xt(new xn(3.2,4.6),new sn({map:I,transparent:!0,depthWrite:!1}));R.rotation.x=-Math.PI/2,R.position.y=.02,t.add(R),this.blobShadow=R}createDust(){const e=new tn,n=new Float32Array(270);n.fill(-9999),e.setAttribute("position",new Ue(n,3));const s=new Yc({color:13616033,size:.7,sizeAttenuation:!0,transparent:!0,opacity:.5,depthWrite:!1}),r=new Bh(e,s);return r.frustumCulled=!1,{points:r,count:90,positions:n,particles:Array.from({length:90},()=>({life:0,maxLife:1,x:0,y:0,z:0,vx:0,vy:0,vz:0})),next:0,clock:0}}setRoute(t){if(this.route=t,t){const e=t.startPose();this.reset(e)}}reset(t){t||(t=this.route?this.route.startPose():{x:0,z:0,yaw:0}),this.pos.set(t.x,this.terrain.sample(t.x,t.z),t.z),this.vel.set(0,0),this.yaw=t.yaw||0,this.yawVel=0,this.verticalVel=0,this.grounded=!0,this.steer=0,this.steerVisual=0,this.speed=0,this.vF=0,this.vR=0,this.pitch=0,this.roll=0,this.bodyRoll=0,this.airTime=0,this.distance=0,this.wrongWay=!1,this.group.position.copy(this.pos),this.group.quaternion.identity(),this.group.rotateY(this.yaw);for(const e of this.dust.particles)e.life=0;this.dust.positions.fill(-9999),this.dust.points.geometry.attributes.position.needsUpdate=!0}forward(){return{x:Math.sin(this.yaw),z:Math.cos(this.yaw)}}right(){return{x:Math.cos(this.yaw),z:-Math.sin(this.yaw)}}update(t,e){this.steer=gn(this.steer,e.steer||0,12,t);const n=this.forward(),s=this.right();if(this.route?(this.roadQuery=this.route.nearest(this.pos.x,this.pos.z),this.onRoad=this.roadQuery.distance<=this.route.roadWidth+1,this.progress=this.roadQuery.progress):(this.roadQuery=null,this.onRoad=!1,this.progress=0),e.frozen)return this.vel.set(0,0),this.vF=0,this.vR=0,this.speed=0,this.yawVel=0,this.verticalVel=0,this.grounded=!0,this.pos.y=this.terrain.sample(this.pos.x,this.pos.z),this.updateVisual(t,0),this.updateDust(t,0,0),{speed:0,vF:0,vR:0,onRoad:this.onRoad,drifting:!1,grounded:!0,progress:this.progress||0,wrongWay:!1};let r=this.vel.x*n.x+this.vel.y*n.z,a=this.vel.x*s.x+this.vel.y*s.z;const o=Math.hypot(r,a),l=qt(e.throttle||0,0,1),c=qt(e.brake||0,0,1),u=!!e.handbrake;if(this.grounded){const m=this.onRoad?56:37,f=this.onRoad?16.5:10.5;if(l>0){const E=1-qt(r/m,0,1)*.88;r+=l*f*E*t}c>0&&(r>.4?r-=23*c*t:r>-10&&(r-=7.5*c*t)),u&&(r-=Math.sign(r)*4*t),r-=Math.sign(r)*(this.onRoad?.55:2.2)*t,r-=r*Math.abs(r)*(this.onRoad?.0018:.0042)*t,r-=r*(this.onRoad?.08:.22)*t,l===0&&c===0&&Math.abs(r)<3.5&&(r*=Math.exp(-5.5*t));const{gx:M,gz:T}=this.terrain.gradient(this.pos.x,this.pos.z,6),S=1+M*M+T*T;r+=-9.81*(M*n.x+T*n.z)/S*t,a+=-9.81*(M*s.x+T*s.z)/S*t*.7;let b=(this.onRoad?7.8:5.2)/(1+o*.014);u&&(b*=.19),a*=Math.exp(-b*t),!this.onRoad&&o>3&&(a+=(Math.random()-.5)*2.2*t);const g=this.steer*qt(2.95-o*.032,1.15,2.95)*Math.sign(r||1)*qt(Math.abs(r)/2.6,0,1);this.yawVel=gn(this.yawVel,g,u?4:9.5,t),u&&Math.abs(r)>6&&(this.yawVel+=this.steer*1.4*qt(o/20,0,1)*t),this.drifting=Math.abs(a)>3.2&&o>7}else this.drifting=!1,this.yawVel=gn(this.yawVel,this.yawVel*.985,.3,t),r-=r*.02*t;this.yaw=e0(this.yaw+this.yawVel*t);const d=this.forward(),h=this.right();this.vel.set(d.x*r+h.x*a,d.z*r+h.z*a);const p=this.pos.x+this.vel.x*t,_=this.pos.z+this.vel.y*t;this.terrain.inside(p,_,3)&&this.terrain.sample(p,_)>.6?(this.pos.x=p,this.pos.z=_):this.vel.multiplyScalar(.2);const v=this.terrain.sample(this.pos.x,this.pos.z);if(!this.grounded)this.verticalVel-=19*t,this.pos.y+=this.verticalVel*t,this.pos.y<=v&&(this.pos.y=v,this.verticalVel=0,this.grounded=!0);else{const m=v,f=(m-this.pos.y)*155-this.verticalVel*20;this.verticalVel+=f*t,this.pos.y+=this.verticalVel*t,this.pos.y<m&&(this.pos.y=m,this.verticalVel=Math.max(0,this.verticalVel*.25)),this.pos.y>m+.9&&this.verticalVel>2&&(this.grounded=!1,this.airTime=0)}if(this.grounded||(this.airTime+=t),this.vF=r,this.vR=a,this.speed=o,this.distance+=Math.abs(r)*t,this.roadQuery&&o>4){const m=this.roadQuery,f=(this.vel.x*m.tangent.x+this.vel.y*m.tangent.z)/Math.max(.001,o);this.wrongWay=f<-.35}else this.wrongWay=!1;return this.updateVisual(t,o),this.updateDust(t,o,l),{speed:o,vF:r,vR:a,onRoad:this.onRoad,drifting:this.drifting,grounded:this.grounded,progress:this.progress||0,wrongWay:this.wrongWay}}updateVisual(t,e){const n=this.forward(),s=this.right(),r=3.2,a=this.terrain.sample(this.pos.x+n.x*1.4,this.pos.z+n.z*1.4),o=this.terrain.sample(this.pos.x-n.x*1.4,this.pos.z-n.z*1.4),l=this.terrain.sample(this.pos.x+s.x*.85,this.pos.z+s.z*.85),c=this.terrain.sample(this.pos.x-s.x*.85,this.pos.z-s.z*.85);let u,d;this.grounded?(u=Math.atan2(o-a,r),d=Math.atan2(l-c,r*.54),u=qt(u,-.55,.55),d=qt(d,-.4,.4)):(u=qt(-this.verticalVel*.035,-.35,.35),d=this.roll*.98),this.pitch=gn(this.pitch,u,this.grounded?10:2,t),this.roll=gn(this.roll,d,this.grounded?9:2,t);const h=this.yawVel*this.vF;this.bodyRoll=gn(this.bodyRoll,qt(-h*.01,-.16,.16),7,t),this.group.position.copy(this.pos),this.group.position.y+=.02;const p=new On().setFromAxisAngle(new O(0,1,0),this.yaw),_=new On().setFromAxisAngle(new O(1,0,0),this.pitch),v=new On().setFromAxisAngle(new O(0,0,1),this.roll+this.bodyRoll);this.group.quaternion.copy(p).multiply(_).multiply(v),this.steerVisual=gn(this.steerVisual,this.steer*.48,12,t),this.wheelSpin+=this.vF/Ma*t;for(const m of this.wheels)m.spin.rotation.x=this.wheelSpin,m.front&&(m.pivot.rotation.y=this.steerVisual);this.blobShadow.material.opacity=qt(1-this.airTime*1.4,0,1)}updateDust(t,e,n){const s=this.dust;if(s.clock+=t,this.grounded&&e>5&&(!this.onRoad||this.drifting||n>.9)&&s.clock>.035){s.clock=0;const a=this.forward(),o=this.right();for(const l of[-1,1]){const c=s.particles[s.next];s.next=(s.next+1)%s.count,c.life=c.maxLife=.65+Math.random()*.55,c.x=this.pos.x-a.x*1.5+o.x*l*.8,c.z=this.pos.z-a.z*1.5+o.z*l*.8,c.y=this.pos.y+.12,c.vx=-this.vel.x*.16+(Math.random()-.5)*.7,c.vz=-this.vel.y*.16+(Math.random()-.5)*.7,c.vy=.7+Math.random()*1.2}}for(let a=0;a<s.count;a++){const o=s.particles[a];if(o.life<=0)continue;if(o.life-=t,o.life<=0){s.positions[a*3+1]=-9999;continue}o.x+=o.vx*t,o.y+=o.vy*t,o.z+=o.vz*t,o.vy+=1*t;const l=o.life/o.maxLife;s.positions[a*3]=o.x,s.positions[a*3+1]=o.y,s.positions[a*3+2]=o.z,l<.02&&(s.positions[a*3+1]=-9999)}s.points.geometry.attributes.position.needsUpdate=!0}}class w0{constructor(t){this.renderer=t,this.target=new Rn(640,360,{minFilter:ye,magFilter:ye,depthBuffer:!0,stencilBuffer:!1}),this.target.texture.generateMipmaps=!1,this.postScene=new Vc,this.postCamera=new Fo(-1,1,1,-1,0,1),this.material=new Gn({depthTest:!1,depthWrite:!1,uniforms:{tDiffuse:{value:this.target.texture},uResolution:{value:new Gt(640,360)},uScreen:{value:new Gt(1280,720)},uTime:{value:0}},vertexShader:`
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
      `}),this.quad=new Xt(new xn(2,2),this.material),this.quad.frustumCulled=!1,this.postScene.add(this.quad)}resize(t,e){const n=t<700?.6:.46,s=Math.max(420,Math.min(1024,Math.round(t*n))),r=Math.max(260,Math.round(s*(e/t)));this.target.setSize(s,r),this.material.uniforms.uResolution.value.set(s,r),this.material.uniforms.uScreen.value.set(t,e),this.postCamera.updateProjectionMatrix()}render(t,e,n){const s=this.renderer;this.material.uniforms.uTime.value=n,s.setRenderTarget(this.target),s.clear(),s.render(t,e),s.setRenderTarget(null),s.render(this.postScene,this.postCamera)}}class A0{constructor(){this.ctx=null,this.ready=!1,this.muted=!1,this.started=!1}init(){if(this.ctx)return;const t=window.AudioContext||window.webkitAudioContext;if(!t)return;this.ctx=new t;const e=this.ctx;this.master=e.createGain(),this.master.gain.value=.55,this.master.connect(e.destination),this.engineGain=e.createGain(),this.engineGain.gain.value=0,this.engineFilter=e.createBiquadFilter(),this.engineFilter.type="lowpass",this.engineFilter.frequency.value=900,this.engineFilter.Q.value=1.4,this.engineGain.connect(this.engineFilter).connect(this.master),this.osc1=e.createOscillator(),this.osc1.type="sawtooth",this.osc1.frequency.value=60,this.osc2=e.createOscillator(),this.osc2.type="square",this.osc2.frequency.value=30;const n=e.createGain();n.gain.value=.35,this.osc1.connect(this.engineGain),this.osc2.connect(n).connect(this.engineGain),this.osc1.start(),this.osc2.start();const r=e.createBuffer(1,e.sampleRate*2,e.sampleRate),a=r.getChannelData(0);let o=0;for(let c=0;c<a.length;c++){const u=Math.random()*2-1;o=o*.72+u*.28,a[c]=o}this.noiseBuffer=r;const l=(c,u,d,h)=>{const p=e.createBufferSource();p.buffer=r,p.loop=!0;const _=e.createBiquadFilter();_.type=c,_.frequency.value=u,_.Q.value=d;const v=e.createGain();return v.gain.value=h,p.connect(_).connect(v).connect(this.master),p.start(),{src:p,filter:_,gain:v}};this.wind=l("bandpass",900,.6,0),this.gravel=l("lowpass",340,1.2,0),this.skid=l("bandpass",1500,3.5,0),this.ready=!0}async start(){this.ctx||this.init(),this.ctx&&(this.ctx.state==="suspended"&&await this.ctx.resume(),this.started=!0)}setMuted(t){this.muted=t,this.master&&this.master.gain.setTargetAtTime(t?0:.55,this.ctx.currentTime,.05)}update(t){if(!this.ready||!this.started)return;const e=this.ctx.currentTime,n=t.speed||0,s=t.throttle||0,r=t.onRoad,a=t.drifting,o=t.running,l=13,c=Math.min(5,Math.floor(n/l)),u=(n-c*l)/l,d=o?.22+u*.72+s*.18:0,h=42+c*7+d*92;this.osc1.frequency.setTargetAtTime(h,e,.035),this.osc2.frequency.setTargetAtTime(h*.5,e,.035),this.engineFilter.frequency.setTargetAtTime(500+s*900+n*12,e,.06),this.engineGain.gain.setTargetAtTime(o?.1+s*.12+n*.0015:0,e,.08),this.wind.gain.gain.setTargetAtTime(Math.min(.14,n*.0028),e,.12),this.wind.filter.frequency.setTargetAtTime(700+n*22,e,.15),this.gravel.gain.gain.setTargetAtTime(o&&!r?Math.min(.11,n*.0032):0,e,.09),this.skid.gain.gain.setTargetAtTime(o&&a?Math.min(.1,n*.0025):0,e,.05)}}Jt.enabled=!1;const it=i=>document.getElementById(i),Pr=i=>Math.max(0,Math.min(1,i)),Hn=it("game"),Pi=new Jg({canvas:Hn,antialias:!1,powerPreference:"high-performance",stencil:!1});Pi.setPixelRatio(1);Pi.setSize(window.innerWidth,window.innerHeight,!1);Pi.outputColorSpace=bs;Pi.shadowMap.enabled=!0;Pi.shadowMap.type=_s;const Ae=new Vc;Ae.background=new Dt(12112604);Ae.fog=new Ro(12835036,460,2900);const Yt=new En(62,window.innerWidth/window.innerHeight,.35,9e3);Yt.position.set(-80,760,1100);const mu=new O(-.42,.78,.46).normalize(),Ke=new jh(16773586,2.5);Ke.position.copy(mu).multiplyScalar(1300);Ke.castShadow=!0;Ke.shadow.mapSize.set(2048,2048);Ke.shadow.camera.left=-850;Ke.shadow.camera.right=850;Ke.shadow.camera.top=850;Ke.shadow.camera.bottom=-850;Ke.shadow.camera.near=10;Ke.shadow.camera.far=3600;Ke.shadow.bias=-7e-4;Ke.shadow.normalBias=.8;Ae.add(Ke);Ae.add(Ke.target);const R0=new Zh(11850984,5527614,1.15);Ae.add(R0);const C0=new td(9085090,.36);Ae.add(C0);function P0(){const i=new Gn({side:je,depthWrite:!1,uniforms:{uTop:{value:new Dt(7120327)},uHorizon:{value:new Dt(14411487)},uSun:{value:mu.clone()}},vertexShader:`
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
    `}),t=new Xt(new Io(6e3,24,12),i);return t.frustumCulled=!1,t}Ae.add(P0());const zo=new w0(Pi);zo.resize(window.innerWidth,window.innerHeight);function L0(){const i=window.innerWidth,t=window.innerHeight;Yt.aspect=i/t,Yt.updateProjectionMatrix(),Pi.setSize(i,t,!1),zo.resize(i,t)}window.addEventListener("resize",L0);let yt=null,di=null,Lr=null,xt=null,Bt=null,cr=null,ur=null,Ps=null,Zi=null,ui=null,vr=!1,Ji=!1,Qi=!1,Dr=0,Ne="loading",mi=0,Mr=0,po=-1,$n=null,Ir=0,Go=0,Ho=0,Sr="chase",Ms=null,mo=[],ae=!1,_e=null,xe=null,un=!1,An=0,Ie=null,D0=ko(1592594996);const Ss=new A0,fi=new Set,on={throttle:0,brake:0,steer:0,handbrake:!1},Yi={throttle:0,brake:0,steer:0,handbrake:!1},kt={yaw:.72,pitch:.86,distance:1500,target:new O(0,380,0)};function ko(i){let t=i>>>0;return function(){t|=0,t=t+1831565813|0;let n=Math.imul(t^t>>>15,1|t);return n=n+Math.imul(n^n>>>7,61|n)^n,((n^n>>>14)>>>0)/4294967296}}let _c=0;function He(i,t=""){const e=it("toast");e.textContent=i,e.className=`show ${t}`.trim(),window.clearTimeout(_c),_c=window.setTimeout(()=>{e.className=""},t==="error"?6500:3800)}function li(i,t){it("loadingBar").style.width=`${Math.round(Pr(i)*100)}%`,t&&(it("loadingText").textContent=t)}function Ls(i){i.traverse(t=>{t.geometry&&t.geometry.dispose(),t.material&&(Array.isArray(t.material)?t.material.forEach(e=>e.dispose()):t.material.dispose())}),Ae.remove(i)}function gu(i){return`rnr_best_${i.name}_${Math.round(i.length)}`}function _u(i){try{const t=localStorage.getItem(gu(i));return t?Number(t):null}catch{return null}}function I0(i,t){try{localStorage.setItem(gu(i),String(t))}catch{}}function Vo(){di&&(Ls(di),di=null),ui&&(Ls(ui),ui=null),di=o0(yt),Ae.add(di),Zi&&(ui=c0(yt,Zi),ui.visible=vr,Ae.add(ui)),Ps=d0(yt,Zi?.image||null)}function Wo(i){vr=!!i&&!!Zi,ui&&(ui.visible=vr);const t=it("builderTopo");t&&(t.checked=vr),i&&!Zi&&He("This scene has no topo basemap. The route picker still works on the 3D terrain.","error")}function Gr(i,{announce:t=!1,pad:e=!0}={}){e&&(yt.resetHeights(),yt.flattenPad(i.start.x,i.start.z,18,34),i.snapToTerrain(),di&&Vo()),Bt=i,cr&&Ls(cr),cr=E0(Bt,yt),Ae.add(cr),ur&&Ls(ur),ur=h0(yt,Bt,ko(523124044)),Ae.add(ur),xt.setRoute(Bt),$n=_u(Bt),it("stageName").textContent=Bt.name.toUpperCase(),it("stageLength").textContent=`${(Bt.length/1e3).toFixed(2)} KM`;const n=yt.latLonFromWorld(Bt.start.x,Bt.start.z),s=yt.latLonFromWorld(Bt.finish.x,Bt.finish.z);it("startCoord").textContent=Cr(n),it("finishCoord").textContent=Cr(s),Hr(),it("osrmStatus").textContent="",it("osrmStatus").className="hint",W0(),Ns(),t&&He(`${Bt.name} — ${(Bt.length/1e3).toFixed(2)} km. Click START ENGINE or press Enter.`)}function Hr(){it("best").textContent=$n?`BEST ${Rr($n)}`:"BEST --:--.---"}function Ns({countdownNow:i=Qi}={}){!Bt||!xt||(Ne=i?"countdown":"intro",mi=0,Mr=3,po=-1,Ir=0,Go=0,Ho=0,xt.reset(Bt.startPose()),it("resultScreen").classList.add("hidden"),it("wrongWay").classList.remove("show"),it("timer").textContent="00:00.000",it("progressBar").style.width="0%",Hr(),i||it("countdown").classList.remove("pop"))}function xu(){Qi=!0,it("startScreen").classList.add("hidden"),it("hud").classList.remove("hidden"),Ns({countdownNow:!0}),Ss.start()}function N0(){if(Ne!=="racing")return;Ne="finished";const i=!$n||mi<$n;i&&($n=mi,I0(Bt,$n),Hr()),it("resultTime").textContent=Rr(mi),it("resultBest").textContent=i?"★ NEW PERSONAL BEST ★":`PERSONAL BEST ${Rr($n)}`,it("resultMeta").textContent=`${Bt.name.toUpperCase()} · ${(Bt.length/1e3).toFixed(2)} KM · TOP ${Math.round(Ir*3.6)} KM/H · DRIFT ${Go.toFixed(1)} S · AIR ${Ho.toFixed(1)} S`,it("resultScreen").classList.remove("hidden"),it("wrongWay").classList.remove("show"),He("Stage complete. R to run it again, N for a new stage.")}function Xo(){yt&&(it("resultScreen").classList.add("hidden"),He("Scouting a new rally stage…"),setTimeout(()=>{try{yt.resetHeights();const i=v0(yt,D0);Gr(i,{announce:!0})}catch(i){Vo(),He(i.message||"No stage found. Try the picker instead.","error")}},30))}function U0(i){const t=new cn,e=new Xt(new Cn(.24,.32,7.4,6),new sn({color:i}));e.position.y=3.7,t.add(e);const n=new Xt(new xn(3,1.7),new sn({color:i,side:_n,toneMapped:!1}));n.position.set(1.5,6.4,0),t.add(n);const s=new Xt(new Cn(1.7,1.7,.25,10),new sn({color:i,toneMapped:!1}));return s.position.y=.12,t.add(s),t}function qo(){for(const i of mo)Ae.remove(i),Ls(i);mo=[]}function xc(i,t){const e=U0(t);e.position.set(i.x,yt.sample(i.x,i.z)+.1,i.z),Ae.add(e),mo.push(e)}function jn(i,t=""){const e=it("builderStatus");e&&(e.textContent=i,e.className=`builder-status ${t}`.trim())}function Ai(){const i=!!_e,t=!!xe;it("builderStepA").classList.toggle("active",!i),it("builderStepA").classList.toggle("done",i),it("builderStepB").classList.toggle("active",i&&!t),it("builderStepB").classList.toggle("done",t),it("builderStepRoute").classList.toggle("active",i&&t);const e=i&&t&&!un;it("builderOsrm").disabled=!e,it("builderOffroad").disabled=!e,it("builderOsrm").textContent=un?"ROUTING…":"OSRM ROUTE",it("builderA").textContent=i?Cr(yt.latLonFromWorld(_e.x,_e.z)):"—",it("builderB").textContent=t?Cr(yt.latLonFromWorld(xe.x,xe.z)):"—"}function F0(){if(!yt)return;const i=Math.cos(kt.pitch),t=kt.target.x,e=kt.target.z,n=Math.max(yt.sample(t,e)+30,kt.target.y);kt.target.set(t,n,e);const s=t+Math.sin(kt.yaw)*i*kt.distance,r=e+Math.cos(kt.yaw)*i*kt.distance,a=Math.max(n+Math.sin(kt.pitch)*kt.distance,yt.sample(s,r)+20);Yt.position.set(s,a,r),Yt.lookAt(kt.target)}function vu(){if(!yt||ae)return;ae=!0,un=!1,An++,_e=null,xe=null,Ms="start",qo(),Wo(!0);const i=Bt?(Bt.start.x+Bt.finish.x)/2:0,t=Bt?(Bt.start.z+Bt.finish.z)/2:0;kt.target.set(qt(i,-yt.sizeX/2+100,yt.sizeX/2-100),yt.sample(i,t)+35,qt(t,-yt.sizeZ/2+100,yt.sizeZ/2-100)),kt.yaw=.72,kt.pitch=.86,kt.distance=1550,F0(),it("builderPanel").classList.remove("hidden"),it("hud").classList.add("building"),jn("Click the mountain to place the START point. Drag to orbit, right-drag to pan, wheel to zoom."),Ai(),He("3D ROUTE BUILDER — pick a start and a finish, then let OSRM find the road.")}function as({restoreBasemap:i=!0}={}){ae=!1,un=!1,An++,Ms=null,Ie=null,qo(),it("builderPanel").classList.add("hidden"),it("hud").classList.remove("building"),i&&Wo(!1)}function Mu(i){as(),Gr(i,{announce:!0})}async function Su(){if(!_e||!xe||un||!yt)return;const i=++An;un=!0,Ai();const t=it("builderProfile").value;jn(`Asking OSRM (${t}) for a road between the two points…`);const e=yt.latLonFromWorld(_e.x,_e.z),n=yt.latLonFromWorld(xe.x,xe.z);try{const s=await Bo(yt,{a:e,b:n,profile:t});if(!ae||i!==An)return;const r=s.snapped?.a!=null?` · snap ${Math.round(s.snapped.a)} m / ${Math.round(s.snapped.b)} m`:"";jn(`OSRM found ${(s.distance/1e3).toFixed(2)} km in ${Math.round(s.duration/60)} min${r}.`,"ok"),Mu(s.route)}catch(s){if(!ae||i!==An)return;jn(`${s.message} The OFF-ROAD ROUTE button is still available.`,"err"),He(s.message,"error")}finally{i===An&&(un=!1,ae&&Ai())}}function O0(){if(!_e||!xe||un||!yt)return;const i=++An;un=!0,Ai(),jn("Routing across the mountain with the off-road A* router…");const t={..._e},e={...xe};setTimeout(()=>{try{const n=Cs(yt,t,e,{name:"Custom A↔B Stage"});if(!ae||i!==An)return;Mu(n)}catch(n){if(!ae||i!==An)return;jn(`${n.message} Try two points on gentler ground.`,"err"),He(n.message||"Those points are not connected by drivable ground.","error")}finally{i===An&&(un=!1,ae&&Ai())}},30)}const vc=new nd,Sa=new Gt;function B0(i){if(!di)return null;const t=Hn.getBoundingClientRect();Sa.x=(i.clientX-t.left)/t.width*2-1,Sa.y=-((i.clientY-t.top)/t.height)*2+1,vc.setFromCamera(Sa,Yt);const e=vc.intersectObject(di,!1);if(!e.length)return He("Click directly on the mountain, not the sky.","error"),null;const n=e[0].point;return n.y<3?(He("That is the fjord. Pick dry ground.","error"),null):yt.slope(n.x,n.z)>.9?(He("That face is a cliff. Pick gentler ground.","error"),null):{x:n.x,z:n.z}}function z0(i){if(!ae||!Ms)return;const t=B0(i);if(t){if(!_e||_e&&xe){An++,un=!1,qo(),_e=t,xe=null,xc(_e,8118414),Ms="finish",jn("Start set. Now click the FINISH point on the map."),Ai();return}xe=t,xc(xe,16763210),Ms="start",Ai(),jn("Both points set. Asking OSRM for a road…"),Su()}}function G0(i){if(ae&&!(i.button!==0&&i.button!==2)){Ie={id:i.pointerId,button:i.button,lastX:i.clientX,lastY:i.clientY,moved:0};try{Hn.setPointerCapture(i.pointerId)}catch{}i.preventDefault()}}function H0(i){if(!ae||!Ie||i.pointerId!==Ie.id)return;const t=i.clientX-Ie.lastX,e=i.clientY-Ie.lastY;if(Ie.lastX=i.clientX,Ie.lastY=i.clientY,Ie.moved+=Math.abs(t)+Math.abs(e),!(Ie.moved<4))if(Ie.button===0)kt.yaw-=t*.006,kt.pitch=qt(kt.pitch+e*.004,.22,1.38);else{const n=kt.distance*.00135,s=Math.cos(kt.yaw),r=Math.sin(kt.yaw);kt.target.x+=(-s*t+r*e)*n,kt.target.z+=(r*t+s*e)*n,kt.target.x=qt(kt.target.x,-yt.sizeX/2+80,yt.sizeX/2-80),kt.target.z=qt(kt.target.z,-yt.sizeZ/2+80,yt.sizeZ/2-80),kt.target.y=yt.sample(kt.target.x,kt.target.z)+35}}function k0(i){if(!ae||!Ie||i.pointerId!==Ie.id)return;const t=Ie.moved<6&&Ie.button===0,e=Ie.id;Ie=null;try{Hn.releasePointerCapture(e)}catch{}t&&z0(i)}function V0(i){ae&&(i.preventDefault(),kt.distance=qt(kt.distance*Math.exp(i.deltaY*.0012),230,3800))}const yu=it("minimap"),Mt=yu.getContext("2d"),Fn=yu.width;function In(i,t){return{x:(i+yt.sizeX/2)/yt.sizeX*Fn,y:(t+yt.sizeZ/2)/yt.sizeZ*Fn}}function W0(){if(!Bt)return;Mt.clearRect(0,0,Fn,Fn),Ps&&Mt.drawImage(Ps,0,0,Fn,Fn);const i=Bt.samples;Mt.lineJoin="round",Mt.lineCap="round",Mt.strokeStyle="rgba(0,0,0,.65)",Mt.lineWidth=6,Mt.beginPath();for(let n=0;n<i.length;n+=2){const s=In(i[n].x,i[n].z);n===0?Mt.moveTo(s.x,s.y):Mt.lineTo(s.x,s.y)}Mt.stroke(),Mt.strokeStyle="#f0ce58",Mt.lineWidth=2.4,Mt.stroke();const t=In(Bt.start.x,Bt.start.z);Mt.fillStyle="#8fe6a3",Mt.beginPath(),Mt.arc(t.x,t.y,4,0,Math.PI*2),Mt.fill(),Mt.strokeStyle="#101513",Mt.lineWidth=1.5,Mt.stroke();const e=In(Bt.finish.x,Bt.finish.z);Mt.fillStyle="#f0ce58",Mt.fillRect(e.x-4,e.y-4,8,8),Mt.strokeStyle="#101513",Mt.strokeRect(e.x-4,e.y-4,8,8)}function X0(){if(!Bt||!xt||!yt)return;Mt.clearRect(0,0,Fn,Fn),Ps&&Mt.drawImage(Ps,0,0,Fn,Fn);const i=Bt.samples;Mt.lineJoin="round",Mt.lineCap="round",Mt.strokeStyle="rgba(0,0,0,.68)",Mt.lineWidth=6,Mt.beginPath();for(let o=0;o<i.length;o+=2){const l=In(i[o].x,i[o].z);o===0?Mt.moveTo(l.x,l.y):Mt.lineTo(l.x,l.y)}Mt.stroke(),Mt.strokeStyle="#f0ce58",Mt.lineWidth=2.4,Mt.stroke();const t=In(Bt.start.x,Bt.start.z);Mt.fillStyle="#8fe6a3",Mt.beginPath(),Mt.arc(t.x,t.y,4,0,Math.PI*2),Mt.fill();const e=In(Bt.finish.x,Bt.finish.z);if(Mt.fillStyle="#f0ce58",Mt.fillRect(e.x-4,e.y-4,8,8),Mt.strokeStyle="#101513",Mt.lineWidth=1.5,Mt.strokeRect(e.x-4,e.y-4,8,8),ae){if(_e&&xe){const o=In(_e.x,_e.z),l=In(xe.x,xe.z);Mt.strokeStyle="rgba(255,255,255,.75)",Mt.setLineDash([4,4]),Mt.lineWidth=1.5,Mt.beginPath(),Mt.moveTo(o.x,o.y),Mt.lineTo(l.x,l.y),Mt.stroke(),Mt.setLineDash([])}for(const[o,l]of[[_e,"#8fe6a3"],[xe,"#ffc94a"]]){if(!o)continue;const c=In(o.x,o.z);Mt.fillStyle=l,Mt.beginPath(),Mt.arc(c.x,c.y,5,0,Math.PI*2),Mt.fill(),Mt.strokeStyle="#101513",Mt.lineWidth=1.5,Mt.stroke()}}const n=In(xt.pos.x,xt.pos.z),s=xt.forward(),r=-s.z,a=s.x;Mt.fillStyle="#f4efe0",Mt.strokeStyle="#0a0e0b",Mt.lineWidth=1.5,Mt.beginPath(),Mt.moveTo(n.x+s.x*7,n.y+s.z*7),Mt.lineTo(n.x-s.x*4+r*4,n.y-s.z*4+a*4),Mt.lineTo(n.x-s.x*4-r*4,n.y-s.z*4-a*4),Mt.closePath(),Mt.fill(),Mt.stroke()}const hr=new O(0,0,0),qe=new O,Xi=new O;function q0(i){const t=Math.cos(kt.pitch),e=kt.target,n=new O(e.x+Math.sin(kt.yaw)*t*kt.distance,e.y+Math.sin(kt.pitch)*kt.distance,e.z+Math.cos(kt.yaw)*t*kt.distance),s=yt.sample(n.x,n.z)+20;n.y<s&&(n.y=s),Yt.position.lerp(n,1-Math.exp(-9*i));const r=yt.sample(e.x,e.z)+30;e.y<r&&(e.y=gn(e.y,r,8,i)),Yt.lookAt(e);const a=gn(Yt.fov,56,4,i);Math.abs(Yt.fov-a)>.01&&(Yt.fov=a,Yt.updateProjectionMatrix())}function Y0(i){if(!xt||!yt)return;if(ae){q0(i);return}const t=xt.forward();if(!Qi||Ne==="intro"){const e=Dr*.09+.6,n=24;qe.set(xt.pos.x+Math.cos(e)*n,xt.pos.y+10.5,xt.pos.z+Math.sin(e)*n);const s=yt.sample(qe.x,qe.z)+2.2;qe.y=Math.max(qe.y,s),Yt.position.lerp(qe,1-Math.exp(-2.2*i)),Xi.set(xt.pos.x,xt.pos.y+1.3,xt.pos.z),hr.lerp(Xi,1-Math.exp(-4*i)),Yt.lookAt(hr)}else if(Sr==="hood")Yt.position.set(xt.pos.x+t.x*.5,xt.pos.y+1.55,xt.pos.z+t.z*.5),Xi.set(xt.pos.x+t.x*22,xt.pos.y+1.6,xt.pos.z+t.z*22),Yt.lookAt(Xi),Yt.fov=gn(Yt.fov,68,4,i),Yt.updateProjectionMatrix();else{const e=xt.speed;let n=7+e*.045;const s=2.8+e*.018;for(let d=0;d<5;d++){const h=xt.pos.x-t.x*n,p=xt.pos.z-t.z*n;if(yt.sample(h,p)<xt.pos.y+2)break;n*=.72}qe.set(xt.pos.x-t.x*n,xt.pos.y+s,xt.pos.z-t.z*n);let r=-1/0;for(let d=0;d<=8;d++){const h=d/8,p=xt.pos.x+(qe.x-xt.pos.x)*h,_=xt.pos.z+(qe.z-xt.pos.z)*h;r=Math.max(r,yt.sample(p,_))}const a=xt.pos.y+8+Math.min(2,e*.04);qe.y<r+1.4&&(qe.y=Math.min(r+1.4,a));const o=yt.sample(qe.x,qe.z);qe.y<o+1.2&&(qe.y=Math.min(o+1.2,a+2)),Yt.position.lerp(qe,1-Math.exp(-5.4*i));const l=yt.sample(Yt.position.x,Yt.position.z)+1.1;if(Yt.position.y<l&&(Yt.position.y=gn(Yt.position.y,l,16,i)),xt.speed>6&&(!xt.onRoad||!xt.grounded)){const d=Math.min(.12,xt.speed*.0035)*(xt.onRoad?.45:1);Yt.position.x+=(Math.random()-.5)*d,Yt.position.y+=(Math.random()-.5)*d,Yt.position.z+=(Math.random()-.5)*d}const c=4+e*.05;Xi.set(xt.pos.x+t.x*c,xt.pos.y+1.15+Math.min(1.2,e*.015),xt.pos.z+t.z*c),hr.lerp(Xi,1-Math.exp(-9*i)),Yt.lookAt(hr);const u=60+Math.min(16,e*.32);Math.abs(Yt.fov-u)>.05&&(Yt.fov=gn(Yt.fov,u,4,i),Yt.updateProjectionMatrix())}}const Nr={KeyW:"up",ArrowUp:"up",KeyS:"down",ArrowDown:"down",KeyA:"left",ArrowLeft:"left",KeyD:"right",ArrowRight:"right",Space:"handbrake"};window.addEventListener("keydown",i=>{Nr[i.code]&&(fi.add(Nr[i.code]),(i.code==="Space"||i.code.startsWith("Arrow"))&&i.preventDefault()),i.code==="KeyR"&&Ji&&Qi&&!ae&&(Ns({countdownNow:!0}),He("Stage restarted.")),i.code==="KeyC"&&(ae||(Sr=Sr==="chase"?"hood":"chase",He(Sr==="hood"?"Bonnet camera.":"Chase camera."))),i.code==="KeyM"&&(Ss.setMuted(!Ss.muted),He(Ss.muted?"Sound off.":"Sound on.")),i.code==="KeyN"&&Ji&&Qi&&!ae&&Xo(),i.code==="Escape"&&ae&&as(),i.code==="Enter"&&Ji&&!Qi&&xu()});window.addEventListener("keyup",i=>{Nr[i.code]&&fi.delete(Nr[i.code])});window.addEventListener("blur",()=>fi.clear());for(const i of document.querySelectorAll("[data-touch]")){const t=i.dataset.touch,e=s=>{s.preventDefault(),i.setPointerCapture?.(s.pointerId),t==="left"?on.steer=-1:t==="right"?on.steer=1:t==="throttle"?on.throttle=1:t==="brake"?on.brake=1:t==="handbrake"&&(on.handbrake=!0)},n=s=>{s.preventDefault(),t==="left"||t==="right"?on.steer=0:t==="throttle"?on.throttle=0:t==="brake"?on.brake=0:t==="handbrake"&&(on.handbrake=!1)};i.addEventListener("pointerdown",e),i.addEventListener("pointerup",n),i.addEventListener("pointercancel",n),i.addEventListener("pointerleave",n)}function $0(){let i=0,t=0,e=0;fi.has("left")&&(i-=1),fi.has("right")&&(i+=1),fi.has("up")&&(t=1),fi.has("down")&&(e=1),i+=on.steer,t=Math.max(t,on.throttle),e=Math.max(e,on.brake),Yi.steer=qt(-i,-1,1),Yi.throttle=Pr(t),Yi.brake=Pr(e),Yi.handbrake=fi.has("handbrake")||on.handbrake}function K0(){if(!xt)return;const i=Math.round(xt.speed*3.6);it("speed").textContent=String(Math.min(999,i)).padStart(3,"0");let t="N";xt.vF<-.5?t="R":xt.speed>1&&(t=String(Math.min(5,Math.floor(xt.speed/12)+1))),it("gear").textContent=t;const e=it("surface");xt.grounded?xt.onRoad?(e.textContent=xt.drifting?"DRIFT":"GRAVEL",e.className=xt.drifting?"off":"road"):(e.textContent="OFF ROAD",e.className="off"):(e.textContent="AIRBORNE",e.className="air"),it("timer").textContent=Rr(mi),Ne==="racing"&&(it("progressBar").style.width=`${Pr(xt.progress)*100}%`),it("wrongWay").classList.toggle("show",xt.wrongWay&&Ne==="racing")}function Z0(){Bt&&($n=_u(Bt),Hr())}function J0(i){if(!ae)if(Ne==="countdown"){Mr-=i;const t=Math.ceil(Mr);if(t!==po&&t>=0){po=t;const e=it("countdown");e.textContent=t>0?String(t):"GO!",e.classList.remove("pop"),e.offsetWidth,e.classList.add("pop"),t===0&&He("Go! Keep it on the mountain.")}Mr<=0&&(Ne="racing",mi=0,it("countdown").textContent="")}else Ne==="racing"&&(mi+=i,Ir=Math.max(Ir,xt.speed),xt.drifting&&(Go+=i),xt.grounded||(Ho+=i))}function Q0(i){Lr&&(Lr.userData.material.uniforms.uTime.value=Dr),xt&&(Ke.position.set(xt.pos.x-650,xt.pos.y+900,xt.pos.z+470),Ke.target.position.set(xt.pos.x,xt.pos.y,xt.pos.z),Ke.target.updateMatrixWorld())}async function j0(){const i=new URLSearchParams(location.search).get("scene");let t=[];try{const o=await fetch("/terrain/scenes/index.json");o.ok&&(t=await o.json())}catch{t=[]}(!Array.isArray(t)||!t.length)&&(t=[{name:"preikestolen",title:"Preikestolen (demo)",path:"scenes/preikestolen/"}]);const e=t.find(o=>o.name===i)||t[0];let n=String(e.path||`scenes/${e.name}/`).replace(/^\/+/,"");n.endsWith("/")||(n+="/");const s=`/terrain/${n}`;let r=null;try{const o=await fetch(`${s}scene.json`);o.ok&&(r=await o.json())}catch{r=null}let a="dtm_1m.tif";try{const o=await fetch(`${s}index.json`);if(o.ok){const c=(await o.json()).files||[];a=c.includes("dtm_1m.tif")?"dtm_1m.tif":c.includes("dtm_10m.tif")?"dtm_10m.tif":a}}catch{}return{entry:e,base:s,sceneMeta:r,tif:a}}async function t_(){try{li(.02,"Reading the 3d_terrain scene catalog…");const{entry:i,base:t,sceneMeta:e,tif:n}=await j0();li(.05,`Opening ${i.title||i.name}…`);const s=e?.basemap?.file;yt=await a0({sceneUrl:`${t}scene.json`,tifUrl:`${t}${n}`,basemapUrl:s?`${t}${s}`:null,onProgress:(a,o)=>li(a,o)}),yt.basemapUrl&&(li(.84,"Draping the Kartverket topo map…"),Zi=await l0(yt.basemapUrl)),li(.86,"Plotting the rally stage…");const r=Cs(yt,{x:-710,z:288},{x:104,z:-245},{name:"Preikestolen Climb"});yt.flattenPad(r.start.x,r.start.z,18,34),r.snapToTerrain(),li(.9,"Sculpting the low-poly mountain…"),Vo(),Lr=u0(yt),Ae.add(Lr),xt=new b0(Ae,yt),Gr(r,{pad:!1}),e_(),document.title=`Retro Norway Rally — ${i.title||"Preikestolen"}`,Ji=!0,Ne="intro",li(1,"Ready."),it("startBtn").disabled=!1,it("startBtn").textContent="START ENGINE",it("startBtn").focus()}catch(i){console.error(i),li(1,"The mountain did not load."),it("loadingText").textContent=`Could not load the terrain: ${i.message}. Run this with “npm run dev” and open the local address.`,it("loadingText").style.color="#ff9b84"}}function e_(){const i=ko(12648430),t=new cn,e=new $e({color:8690082,flatShading:!0}),n=new $e({color:10005425,flatShading:!0});for(let s=0;s<18;s++){const r=s/18*Math.PI*2+i()*.18,a=2800+i()*1900,o=180+i()*520,l=450+i()*500,c=new Or(l,o,5+Math.floor(i()*3),1),u=new Xt(c,s%2?e:n);u.position.set(Math.cos(r)*a,o/2-6,Math.sin(r)*a),u.rotation.y=i()*Math.PI*2,u.scale.z=.7+i()*.8,t.add(u)}t.name="distantPeaks",Ae.add(t)}it("startBtn").addEventListener("click",xu);it("newStage").addEventListener("click",Xo);it("restart").addEventListener("click",()=>{Ns({countdownNow:!0}),He("Stage restarted.")});it("routeBuilder").addEventListener("click",()=>{ae?as():vu()});it("resultRestart").addEventListener("click",()=>{Ns({countdownNow:!0})});it("resultNew").addEventListener("click",Xo);it("builderClose").addEventListener("click",()=>as());it("builderOsrm").addEventListener("click",Su);it("builderOffroad").addEventListener("click",O0);it("builderTopo").addEventListener("change",()=>Wo(it("builderTopo").checked));it("builderProfile").addEventListener("change",()=>{_e&&xe&&!un&&jn(`Profile set to ${it("builderProfile").value}. Press OSRM ROUTE to try it.`)});it("osrmFill").addEventListener("click",()=>{if(!Bt||!yt)return;const i=_e||Bt.start,t=xe||Bt.finish,e=yt.latLonFromWorld(i.x,i.z),n=yt.latLonFromWorld(t.x,t.z);it("osrmALat").value=e.lat.toFixed(6),it("osrmALon").value=e.lon.toFixed(6),it("osrmBLat").value=n.lat.toFixed(6),it("osrmBLon").value=n.lon.toFixed(6),it("osrmStatus").textContent=_e&&xe?"Coordinates filled from the two route-builder points. Hit FETCH.":"Coordinates filled from the current stage. Hit FETCH.",it("osrmStatus").className="hint"});it("osrmGo").addEventListener("click",async()=>{if(!yt)return;const i={lat:Number(it("osrmALat").value),lon:Number(it("osrmALon").value)},t={lat:Number(it("osrmBLat").value),lon:Number(it("osrmBLon").value)};if(![i.lat,i.lon,t.lat,t.lon].every(Number.isFinite)){it("osrmStatus").textContent="Enter four coordinates (latitude and longitude).",it("osrmStatus").className="hint err";return}it("osrmStatus").textContent="Asking OSRM for a road…",it("osrmStatus").className="hint";try{const e=await Bo(yt,{a:i,b:t,profile:it("osrmProfile").value});ae&&as(),Gr(e.route,{announce:!0});const n=e.snapped?.a!=null?` · snap ${Math.round(e.snapped.a)} m / ${Math.round(e.snapped.b)} m`:"";it("osrmStatus").textContent=`OSRM: ${(e.distance/1e3).toFixed(2)} km, ${Math.round(e.duration/60)} min (${e.profile})${n}.`,it("osrmStatus").className="hint ok"}catch(e){it("osrmStatus").textContent=e.message,it("osrmStatus").className="hint err",He(e.message,"error")}});Hn.addEventListener("pointerdown",G0);Hn.addEventListener("pointermove",H0);Hn.addEventListener("pointerup",k0);Hn.addEventListener("pointercancel",()=>{Ie=null});Hn.addEventListener("wheel",V0,{passive:!1});Hn.addEventListener("contextmenu",i=>{ae&&i.preventDefault()});let Mc=performance.now();function Eu(i){const t=Math.min(.05,Math.max(1e-4,(i-Mc)/1e3));if(Mc=i,Dr+=t,$0(),xt&&Ji){const n=Ne==="countdown"||Ne==="intro"||ae?{throttle:0,brake:0,steer:0,handbrake:!1,frozen:!0}:Yi;if(xt.update(t,n),Ne==="racing"&&xt){const s=xt.pos.x-Bt.finish.x,r=xt.pos.z-Bt.finish.z,a=Math.hypot(s,r);xt.progress>.94&&a<13&&N0()}Ne==="finished"&&xt.vel.multiplyScalar(Math.exp(-2.2*t)),K0(),Ss.update({speed:xt.speed,throttle:Ne==="racing"&&!ae?Yi.throttle:0,onRoad:xt.onRoad,drifting:xt.drifting,running:!ae&&(Ne==="racing"||Ne==="countdown")})}Ji&&(J0(t),Q0(),Y0(t),X0()),zo.render(Ae,Yt,Dr),requestAnimationFrame(Eu)}t_();requestAnimationFrame(Eu);window.addEventListener("focus",Z0);window.__rally={scene:Ae,camera:Yt,get terrain(){return yt},get car(){return xt},get route(){return Bt},get phase(){return Ne},get stageTime(){return mi},get builder(){return{active:ae,a:_e,b:xe,busy:un}},openRouteBuilder:vu,closeRouteBuilder:as,generateRoute:(i,t,e)=>Cs(yt,i,t,e),fetchOsrm:i=>Bo(yt,i),screenFromWorld(i,t){Yt.updateMatrixWorld();const e=new O(i,yt.sample(i,t),t).project(Yt);return{x:(e.x*.5+.5)*window.innerWidth,y:(-e.y*.5+.5)*window.innerHeight}}};
