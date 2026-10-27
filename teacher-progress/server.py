from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from urllib.parse import urlsplit,unquote
from pathlib import Path
from datetime import date
import argparse,json,uuid,sqlite3,tempfile,shutil,sys
from http.cookies import SimpleCookie,CookieError
from auth import Auth,AUTH_FILE,COOKIE,SESSION_SECONDS
from database import BASE,DB,connect,statistics,list_students,student_detail,now

STATIC={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js'}

def create_server(db=DB,port=8767,auth_file=AUTH_FILE):
    db=Path(db)
    auth=Auth(auth_file)
    class Handler(BaseHTTPRequestHandler):
        def reply(self,status,value,cookie=None):
            blob=json.dumps(value,ensure_ascii=False).encode('utf-8')
            self.send_response(status);self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(blob)));self.send_header('Cache-Control','no-store')
            if cookie:self.send_header('Set-Cookie',cookie)
            self.end_headers();self.wfile.write(blob)
        def session_token(self):
            try:
                cookies=SimpleCookie(self.headers.get('Cookie',''))
                return cookies[COOKIE].value if COOKIE in cookies else ''
            except CookieError:return ''
        def authenticated(self):return auth.valid(self.session_token())
        def redirect_login(self):
            self.send_response(303);self.send_header('Location','/login');self.send_header('Cache-Control','no-store');self.send_header('Content-Length','0');self.end_headers()
        def local_request(self,write=False):
            expected='127.0.0.1:'+str(self.server.server_port)
            if self.headers.get('Host')!=expected:
                self.reply(403,{'error':'只接受本機預覽網址'});return False
            origin=self.headers.get('Origin')
            if origin and origin!='http://'+expected:
                self.reply(403,{'error':'來源網址不符'});return False
            if write and not self.headers.get('Content-Type','').startswith('application/json'):
                self.reply(415,{'error':'需要JSON格式'});return False
            return True
        def do_GET(self):
            if not self.local_request():return
            path=unquote(urlsplit(self.path).path)
            try:
                public={'/login':'login.html','/login.js':'login.js','/style.css':'style.css'}
                if path not in public and not self.authenticated():
                    if path.startswith('/api/'):self.reply(401,{'error':'請先登入'});return
                    self.redirect_login();return
                if path in STATIC or path in public:
                    p=BASE/(public.get(path) or STATIC[path]);blob=p.read_bytes();ext=p.suffix
                    self.send_response(200);self.send_header('Content-Type',{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[ext]);self.send_header('Content-Length',str(len(blob)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(blob);return
                con=connect(db)
                try:
                    if path=='/api/students':self.reply(200,{'students':list_students(con),'stats':statistics(con)});return
                    if path.startswith('/api/students/'):
                        s=student_detail(con,path.removeprefix('/api/students/'))
                        self.reply(200 if s else 404,s or {'error':'找不到學生'});return
                    if path.startswith('/api/files/'):
                        fid=path.removeprefix('/api/files/')
                        r=con.execute('SELECT filename,pdf_bytes FROM sources WHERE id=?',(fid,)).fetchone()
                        if not r:self.reply(404,{'error':'找不到原始檔'});return
                        self.send_response(200);self.send_header('Content-Type','application/pdf');self.send_header('Content-Length',str(len(r['pdf_bytes'])));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(r['pdf_bytes']);return
                    if path=='/api/export':
                        students=list_students(con)
                        self.reply(200,{'schema_version':1,'exported_at':now(),'stats':statistics(con),'students':[student_detail(con,s['id']) for s in students],'note':'JSON含完整學生紀錄與證據位置；原PDF及逐頁OCR另含於SQLite完整備份。'});return
                    if path=='/api/backup':
                        with tempfile.TemporaryDirectory(prefix='student-db-backup-',dir=BASE) as tmp:
                            p=Path(tmp)/'學生學習紀錄.sqlite3'
                            dst=sqlite3.connect(p)
                            try:con.backup(dst)
                            finally:dst.close()
                            self.send_response(200);self.send_header('Content-Type','application/vnd.sqlite3');self.send_header('Content-Disposition','attachment; filename="student-records.sqlite3"');self.send_header('Content-Length',str(p.stat().st_size));self.send_header('Cache-Control','no-store');self.end_headers()
                            with p.open('rb') as f:shutil.copyfileobj(f,self.wfile)
                        return
                    self.reply(404,{'error':'找不到頁面'})
                finally:con.close()
            except (BrokenPipeError,ConnectionResetError):pass
            except Exception:
                self.log_error('讀取資料失敗');self.reply(500,{'error':'讀取失敗，請查看本機服務狀態'})
        def do_POST(self):
            if not self.local_request(write=True):return
            if self.path=='/api/login':
                try:
                    size=int(self.headers.get('Content-Length','0'))
                    if not 0<size<=8192:raise ValueError()
                    data=json.loads(self.rfile.read(size));password=data.get('password','')
                    if not isinstance(password,str) or len(password)>1024:raise ValueError()
                    token,status=auth.login(password,self.client_address[0])
                    if status!=200:self.reply(status,{'error':'嘗試次數較多，請一分鐘後再試。' if status==429 else '密碼不正確，請重新輸入。'});return
                    self.reply(200,{'ok':True},f'{COOKIE}={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age={SESSION_SECONDS}');return
                except (ValueError,TypeError,AttributeError):self.reply(400,{'error':'請輸入有效密碼'});return
            if not self.authenticated():self.reply(401,{'error':'請先登入'});return
            if self.path=='/api/logout':
                auth.logout(self.session_token());self.reply(200,{'ok':True},f'{COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return
            if self.path!='/api/followups':self.reply(404,{'error':'找不到操作'});return
            try:
                size=int(self.headers.get('Content-Length','0'))
                if size<=0 or size>64000:raise ValueError('紀錄長度不符')
                data=json.loads(self.rfile.read(size));keys=['student_id','observed_date','task','evidence_location','observation','assistance','outcome','next_step']
                clean={k:str(data.get(k,'')).strip() for k in keys}
                for k in ['student_id','observed_date','task','evidence_location','observation','assistance','outcome']:
                    if not clean[k]:raise ValueError('請填齊日期、任務、證據位置、觀察、協助程度及驗收結果')
                if any(len(v)>6000 for v in clean.values()):raise ValueError('單一欄位過長')
                date.fromisoformat(clean['observed_date'])
                if clean['outcome'] not in ['尚待驗收','有協助下完成','可獨立完成','仍需跟進']:raise ValueError('驗收結果不符')
                if clean['assistance'] not in ['未提供協助','口頭提示','示範後完成','與同伴一起完成','尚未確認']:raise ValueError('協助程度不符')
                event_id=str(uuid.UUID(str(data['id'])))
                lesson=data.get('lesson_id') or None
                con=connect(db)
                try:
                    if not con.execute('SELECT id FROM students WHERE id=?',(clean['student_id'],)).fetchone():raise ValueError('找不到學生')
                    if lesson and not con.execute('SELECT id FROM lessons WHERE id=?',(lesson,)).fetchone():raise ValueError('找不到課堂')
                    old=con.execute('SELECT * FROM followups WHERE id=?',(event_id,)).fetchone()
                    if old:
                        if any(old[k]!=clean[k] for k in keys) or old['lesson_id']!=lesson:self.reply(409,{'error':'同一紀錄編號已有不同內容，請重新載入'});return
                        self.reply(200,dict(old));return
                    with con:
                        con.execute('INSERT INTO followups VALUES(?,?,?,?,?,?,?,?,?,?,?)',(event_id,clean['student_id'],lesson,clean['observed_date'],clean['task'],clean['evidence_location'],clean['observation'],clean['assistance'],clean['outcome'],clean['next_step'],now()))
                    self.reply(201,dict(con.execute('SELECT * FROM followups WHERE id=?',(event_id,)).fetchone()))
                finally:con.close()
            except (ValueError,KeyError,TypeError,json.JSONDecodeError):self.reply(400,{'error':'紀錄未能保存：請檢查必填欄位、日期及選項'})
            except sqlite3.Error:self.reply(500,{'error':'資料庫未能保存，請保留輸入內容後重試'})
    return ThreadingHTTPServer(('127.0.0.1',port),Handler)

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8767);args=parser.parse_args()
    if not DB.exists():raise SystemExit('Private database is missing. Provision it separately as described in README.md.')
    if not AUTH_FILE.exists():raise SystemExit('Login password is not configured. Run the password setup script first.')
    print(f'Student database: {DB}\nhttp://127.0.0.1:{args.port}/',flush=True)
    create_server(port=args.port).serve_forever()
