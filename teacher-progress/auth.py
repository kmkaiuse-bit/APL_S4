import hashlib,hmac,json,secrets,time,threading
from pathlib import Path
AUTH_FILE=Path(__file__).resolve().parent/'登入設定.json'
ITERATIONS=600000
COOKIE='student_session'
SESSION_SECONDS=8*60*60
def set_password(password,path=AUTH_FILE):
    if not isinstance(password,str) or len(password)<8:raise ValueError('密碼至少8個字元')
    salt=secrets.token_bytes(32)
    record={'version':1,'iterations':ITERATIONS,'salt':salt.hex(),'hash':hashlib.pbkdf2_hmac('sha256',password.encode(),salt,ITERATIONS).hex()}
    Path(path).write_text(json.dumps(record),encoding='utf-8')
class Auth:
    def __init__(self,path=AUTH_FILE):
        self.lock=threading.Lock();self.sessions={};self.failures={}
        self.config=json.loads(Path(path).read_text(encoding='utf-8')) if Path(path).exists() else None
    def check_password(self,password):
        if not self.config or not isinstance(password,str):return False
        c=self.config
        result=hashlib.pbkdf2_hmac('sha256',password.encode(),bytes.fromhex(c['salt']),c['iterations']).hex()
        return hmac.compare_digest(result,c['hash'])
    def login(self,password,ip):
        with self.lock:
            t=time.monotonic();failures=[x for x in self.failures.get(ip,[]) if t-x<60]
            if len(failures)>=5:return None,429
            if not self.check_password(password):self.failures[ip]=failures+[t];return None,401
            self.failures.pop(ip,None)
            self.sessions={k:v for k,v in self.sessions.items() if v>t}
            token=secrets.token_urlsafe(32);self.sessions[hashlib.sha256(token.encode()).hexdigest()]=t+SESSION_SECONDS
            return token,200
    def valid(self,token):
        if not token:return False
        with self.lock:return self.sessions.get(hashlib.sha256(token.encode()).hexdigest(),0)>time.monotonic()
    def logout(self,token):
        with self.lock:self.sessions.pop(hashlib.sha256(token.encode()).hexdigest(),None)
