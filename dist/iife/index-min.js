var idbKeyval=function(t){"use strict";function e(t){return new Promise(((e,n)=>{t.oncomplete=t.onsuccess=()=>e(t.result),t.onabort=t.onerror=()=>n(t.error)}))}function n(t,n){const r=indexedDB.open(t);r.onupgradeneeded=()=>r.result.createObjectStore(n);const o=e(r);return t=>o.then((e=>e.transaction(n,t).objectStore(n)))}let r;function o(){return r||(r=n("keyval-store","keyval")),r}function u(t,n){return t("readonly").then((t=>(t.openCursor().onsuccess=function(){this.result&&(n(this.result),this.result.continue())},e(t.transaction))))}return t.clear=function(t=o()){return t("readwrite").then((t=>(t.clear(),e(t.transaction))))},t.createStore=n,t.del=function(t,n=o()){return n("readwrite").then((n=>(n.delete(t),e(n.transaction))))},t.entries=function(t=o()){const e=[];return u(t,(t=>e.push([t.key,t.value]))).then((()=>e))},t.get=function(t,n=o()){return n("readonly").then((n=>e(n.get(t))))},t.keys=function(t=o()){const e=[];return u(t,(t=>e.push(t.key))).then((()=>e))},t.promisifyRequest=e,t.set=function(t,n,r=o()){return r("readwrite").then((r=>(r.put(n,t),e(r.transaction))))},t.setMany=function(t,n=o()){return n("readwrite").then((n=>(t.forEach((t=>n.put(t[1],t[0]))),e(n.transaction))))},t.update=function(t,n,r=o()){return r("readwrite").then((r=>e(r.get(t)).then((o=>(r.put(n(o),t),e(r.transaction))))))},t.values=function(t=o()){const e=[];return u(t,(t=>e.push(t.value))).then((()=>e))},t}({});
