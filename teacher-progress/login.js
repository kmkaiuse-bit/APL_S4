document.getElementById('login-form').addEventListener('submit',async e=>{
 e.preventDefault();const button=e.currentTarget.querySelector('button'),message=document.getElementById('message');button.disabled=true;message.textContent='正在登入…';
 try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:document.getElementById('password').value})});const data=await r.json();if(!r.ok)throw Error(data.error);document.getElementById('password').value='';location.replace('/');}
 catch(err){message.textContent=err.message||'暫時未能登入，請稍後重試。';button.disabled=false;}
});
