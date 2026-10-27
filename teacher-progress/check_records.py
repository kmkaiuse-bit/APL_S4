import unittest,tempfile,threading,json,urllib.request,urllib.error,sqlite3,uuid
from pathlib import Path
from auth import set_password
from database import connect,create_schema
from server import create_server

class RecordTests(unittest.TestCase):
    def test_authenticated_followup_persists_and_backup_restores(self):
        with tempfile.TemporaryDirectory() as tmp:
            db=Path(tmp)/'test.sqlite3';config=Path(tmp)/'auth.json'
            c=connect(db);create_schema(c)
            with c:
                c.execute('INSERT INTO students VALUES(?,?,?,?,?)',('DEMO','測試用學生','測試資料',None,'2026-10-27'))
                c.execute('INSERT INTO lessons VALUES(?,?,?,?)',('L22','第二堂',2,None))
            c.close();set_password('TestOnly-Password-42',config)
            server=create_server(db,0,auth_file=config);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            base='http://127.0.0.1:'+str(server.server_port)
            def req(path,data=None,cookie=''):
                r=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers={'Content-Type':'application/json','Cookie':cookie})
                with urllib.request.urlopen(r,timeout=5) as response:return response.status,response.read(),response.headers
            try:
                _,_,headers=req('/api/login',{'password':'TestOnly-Password-42'});cookie=headers['Set-Cookie'].split(';')[0]
                event=dict(id=str(uuid.uuid4()),student_id='DEMO',lesson_id='L22',observed_date='2026-10-27',task='測試任務',evidence_location='測試答案',observation='測試持續保存',assistance='尚未確認',outcome='尚待驗收',next_step='再確認')
                self.assertEqual(req('/api/followups',event,cookie)[0],201)
                self.assertEqual(req('/api/followups',event,cookie)[0],200)
                data=json.loads(req('/api/students/DEMO',cookie=cookie)[1]);self.assertEqual(len(data['followups']),1)
                restored=Path(tmp)/'restore.sqlite3';restored.write_bytes(req('/api/backup',cookie=cookie)[1])
                c=connect(restored)
                try:
                    self.assertEqual(c.execute('PRAGMA integrity_check').fetchone()[0],'ok')
                    self.assertEqual(c.execute('SELECT observation FROM followups').fetchone()[0],'測試持續保存')
                finally:c.close()
            finally:server.shutdown();server.server_close();thread.join()
            c=connect(db)
            try:self.assertEqual(c.execute('SELECT count(*) FROM followups').fetchone()[0],1)
            finally:c.close()

if __name__=='__main__':unittest.main(verbosity=2)
