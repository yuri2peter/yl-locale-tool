const $_GET = (function(){
  const url = window.document.location.href.toString();
  let u = url.split("?");
  if(typeof(u[1]) === "string"){
    u = u[1].split("&");
    let get = {};
    for(let i in u){
      let j = u[i].split("=");
      get[j[0]] = decodeURIComponent(j[1]);
    }
    return get;
  } else {
    return {};
  }
})();

function redirect(url) {
  location.href = url;
}

// 将会包装事件的 debounce 函数
function debounce(fn, delay) {
  let timer = null;
  return function() {
    let context = this;
    let args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(context, args);
    }, delay);
  }
}