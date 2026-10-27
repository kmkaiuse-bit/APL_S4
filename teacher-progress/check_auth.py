import unittest,tempfile,threading,json,urllib.request,urllib.error,time
from pathlib import Path
from auth import set_password,Auth,COOKIE
from server import create_server

class AuthTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.path=Path(self.tmp.name)/'auth.json'
        set_password('TestOnly-Password-42',self.path)
        self.server=create_server(Path(self.tmp.name)/'unused.sqlite3',0,auth_file=self.path)
        self.thread=threading.Thread(target=self.server.serve_forever,daemon=True);self.thread.start()
        self.base='http://127.0.0.1:'+str(self.server.server_port)
    def tearDown(self):self.server.shutdown();self.server.server_close();self.thread.join();self.tmp.cleanup()
    def req(self,path,data=None,cookie='',origin=None):
        headers={'Content-Type':'application/json','Cookie':cookie}
        if origin:headers['Origin']=origin
        request=urllib.request.Request(self.base+path,data=json.dumps(data).encode() if data is not None else None,headers=headers)
        try:
            with urllib.request.urlopen(request) as r:return r.status,r.read(),r.headers
        except urllib.error.HTTPError as e:return e.code,e.read(),e.headers
    def test_all_data_routes_blocked_before_login(self):
        for route in ['/api/students','/api/students/S006','/api/files/F01','/api/export','/api/backup']:
            self.assertEqual(self.req(route)[0],401)
        self.assertEqual(self.req('/api/followups',{})[0],401)
        status,body,headers=self.req('/')
        self.assertEqual(status,200);self.assertIn('請先輸入密碼',body.decode());self.assertNotIn('4C31',body.decode())
    def test_login_wrong_password_cookie_flags_and_logout(self):
        self.assertEqual(self.req('/api/login',{'password':'wrong'})[0],401)
        status,body,headers=self.req('/api/login',{'password':'TestOnly-Password-42'})
        self.assertEqual(status,200);cookie=headers['Set-Cookie']
        self.assertIn('HttpOnly',cookie);self.assertIn('SameSite=Strict',cookie)
        self.assertEqual(self.req('/app.js',cookie=cookie.split(';')[0])[0],200)
        self.assertEqual(self.req('/api/logout',{},cookie=cookie.split(';')[0])[0],200)
        self.assertEqual(self.req('/api/students',cookie=cookie.split(';')[0])[0],401)
    def test_hash_only_expiry_and_rate_limit(self):
        self.assertNotIn('TestOnly-Password-42',self.path.read_text())
        a=Auth(self.path);token,status=a.login('TestOnly-Password-42','test');self.assertTrue(a.valid(token))
        a.sessions[next(iter(a.sessions))]=time.monotonic()-1;self.assertFalse(a.valid(token))
        for i in range(5):self.assertEqual(self.req('/api/login',{'password':'wrong'})[0],401)
        self.assertEqual(self.req('/api/login',{'password':'wrong'})[0],429)
        self.assertEqual(self.req('/api/login',{'password':'TestOnly-Password-42'},origin='https://example.com')[0],403)

if __name__=='__main__':unittest.main(verbosity=2)
