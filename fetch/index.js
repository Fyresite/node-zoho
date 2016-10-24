import fetch from 'isomorphic-fetch';

export default function(uri, options){
  let f_uri = uriFormat(uri);
  return fetch(f_uri,options)
}

function uriFormat(uri){
  let http = 'https';
  if (process.env.NODE_ENV == 'development') {
    http = 'http';
  }
  if(isBrowser()){
    return window.location.port == "" ? window.location.protocol + '//' + window.location.hostname + uri : window.location.protocol + '//' + window.location.hostname + ':' + window.location.port + uri;
  }else{
    return uri.includes("http") ? uri : `${http}://${process.env.hostName}:${process.env.PORT}` + uri;
  }
}

function isBrowser(){
  return typeof window !== 'undefined';
}
