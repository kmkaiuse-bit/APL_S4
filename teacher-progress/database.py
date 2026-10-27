"""Persistent student records; stdlib SQLite, original PDFs and page text included."""
from pathlib import Path
import sqlite3,json,hashlib,re
from datetime import datetime,timezone,timedelta

BASE=Path(__file__).resolve().parent
DB=BASE/'學生學習紀錄.sqlite3'

def now():
    return datetime.now(timezone(timedelta(hours=8))).isoformat(timespec='seconds')

def connect(path=DB):
    con=sqlite3.connect(path,timeout=20)
    con.row_factory=sqlite3.Row
    con.execute('PRAGMA foreign_keys=ON')
    return con

SCHEMA='''
CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS students(
 id TEXT PRIMARY KEY,display_name TEXT NOT NULL,identity_status TEXT NOT NULL,
 official_student_id TEXT,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS lessons(
 id TEXT PRIMARY KEY,label TEXT NOT NULL,sequence INTEGER NOT NULL,lesson_date TEXT);
CREATE TABLE IF NOT EXISTS student_aliases(
 student_id TEXT NOT NULL REFERENCES students(id),alias TEXT NOT NULL,origin TEXT NOT NULL,
 PRIMARY KEY(student_id,alias,origin));
CREATE TABLE IF NOT EXISTS sources(
 id TEXT PRIMARY KEY,lesson_id TEXT NOT NULL REFERENCES lessons(id),filename TEXT NOT NULL,
 original_path TEXT NOT NULL,pages INTEGER NOT NULL,sha256 TEXT NOT NULL,
 pdf_bytes BLOB NOT NULL,imported_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS student_sources(
 student_id TEXT NOT NULL REFERENCES students(id),source_id TEXT NOT NULL REFERENCES sources(id),
 match_status TEXT NOT NULL,PRIMARY KEY(student_id,source_id));
CREATE TABLE IF NOT EXISTS page_text(
 source_id TEXT NOT NULL REFERENCES sources(id),page INTEGER NOT NULL,text TEXT NOT NULL,
 method TEXT NOT NULL,visually_checked INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(source_id,page));
CREATE TABLE IF NOT EXISTS lesson_records(
 student_id TEXT NOT NULL REFERENCES students(id),lesson_id TEXT NOT NULL REFERENCES lessons(id),
 summary TEXT NOT NULL,priority TEXT NOT NULL,review_date TEXT NOT NULL,
 independence TEXT NOT NULL,raw_json TEXT NOT NULL,
 PRIMARY KEY(student_id,lesson_id));
CREATE TABLE IF NOT EXISTS evidence(
 id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES students(id),
 lesson_id TEXT NOT NULL REFERENCES lessons(id),source_id TEXT REFERENCES sources(id),
 page INTEGER,dimension TEXT,kind TEXT NOT NULL,field TEXT NOT NULL,excerpt TEXT NOT NULL,
 finding TEXT NOT NULL,next_step TEXT NOT NULL,verification TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS comparisons(
 student_id TEXT PRIMARY KEY REFERENCES students(id),from_lesson TEXT NOT NULL REFERENCES lessons(id),
 to_lesson TEXT NOT NULL REFERENCES lessons(id),title TEXT NOT NULL,plain_summary TEXT NOT NULL,
 example TEXT NOT NULL,next_step TEXT NOT NULL,followup_group TEXT NOT NULL,
 provisional_match INTEGER NOT NULL,raw_json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS colleague_notes(
 student_id TEXT PRIMARY KEY REFERENCES students(id),first_plain TEXT NOT NULL,
 second_plain TEXT NOT NULL,takeaway TEXT NOT NULL,next_step TEXT NOT NULL,
 reviewed_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS followups(
 id TEXT PRIMARY KEY,student_id TEXT NOT NULL REFERENCES students(id),
 lesson_id TEXT REFERENCES lessons(id),observed_date TEXT NOT NULL,task TEXT NOT NULL,
 evidence_location TEXT NOT NULL,observation TEXT NOT NULL,assistance TEXT NOT NULL,
 outcome TEXT NOT NULL,next_step TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS evidence_student ON evidence(student_id,lesson_id);
CREATE INDEX IF NOT EXISTS followups_student ON followups(student_id,observed_date);
CREATE TRIGGER IF NOT EXISTS no_followup_update BEFORE UPDATE ON followups
 BEGIN SELECT RAISE(ABORT,'Follow-up records are append-only'); END;
CREATE TRIGGER IF NOT EXISTS no_followup_delete BEFORE DELETE ON followups
 BEGIN SELECT RAISE(ABORT,'Follow-up records are append-only'); END;
'''

def create_schema(con):
    con.executescript(SCHEMA)
    con.execute("INSERT OR IGNORE INTO metadata VALUES('schema_version','1')")
    con.commit()

def statistics(con):
    result={t:con.execute(f'SELECT count(*) FROM {t}').fetchone()[0] for t in ['students','lessons','sources','page_text','lesson_records','evidence','comparisons','followups']}
    result['pdf_bytes']=con.execute('SELECT coalesce(sum(length(pdf_bytes)),0) FROM sources').fetchone()[0]
    return result

def list_students(con):
    output=[]
    for r in con.execute('SELECT * FROM students ORDER BY id'):
        s=dict(r);sid=s['id']
        s['aliases']=[x['alias'] for x in con.execute('SELECT alias FROM student_aliases WHERE student_id=?',(sid,))]
        s['lessons']=[dict(x) for x in con.execute('SELECT l.id,l.label,l.sequence FROM lesson_records r JOIN lessons l ON l.id=r.lesson_id WHERE r.student_id=? ORDER BY l.sequence',(sid,))]
        c=con.execute('SELECT title,plain_summary,example,next_step,followup_group,provisional_match FROM comparisons WHERE student_id=?',(sid,)).fetchone()
        s['comparison']=dict(c) if c else None
        s['followup_count']=con.execute('SELECT count(*) FROM followups WHERE student_id=?',(sid,)).fetchone()[0]
        output.append(s)
    return output

def student_detail(con,sid):
    record=con.execute('SELECT * FROM students WHERE id=?',(sid,)).fetchone()
    if not record:return None
    s=dict(record)
    has_notes=con.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='colleague_notes'").fetchone()
    n=con.execute('SELECT * FROM colleague_notes WHERE student_id=?',(sid,)).fetchone() if has_notes else None
    s['colleague_notes']=dict(n) if n else None
    s['aliases']=[dict(r) for r in con.execute('SELECT alias,origin FROM student_aliases WHERE student_id=?',(sid,))]
    s['records']=[]
    for r in con.execute('SELECT r.*,l.label FROM lesson_records r JOIN lessons l ON l.id=r.lesson_id WHERE student_id=? ORDER BY l.sequence',(sid,)):
        item=dict(r);item['raw']=json.loads(item.pop('raw_json'));s['records'].append(item)
    s['sources']=[dict(r) for r in con.execute('SELECT f.id,f.lesson_id,f.filename,f.pages,f.sha256,a.match_status FROM student_sources a JOIN sources f ON f.id=a.source_id WHERE a.student_id=? ORDER BY f.id',(sid,))]
    s['evidence']=[dict(r) for r in con.execute('SELECT * FROM evidence WHERE student_id=? ORDER BY lesson_id,id',(sid,))]
    c=con.execute('SELECT * FROM comparisons WHERE student_id=?',(sid,)).fetchone()
    s['comparison']=dict(c) if c else None
    if s['comparison']:s['comparison']['raw']=json.loads(s['comparison'].pop('raw_json'))
    s['followups']=[dict(r) for r in con.execute('SELECT * FROM followups WHERE student_id=? ORDER BY observed_date DESC,created_at DESC,id DESC',(sid,))]
    return s
