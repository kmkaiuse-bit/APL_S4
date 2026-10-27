from getpass import getpass
from auth import set_password
if __name__=='__main__':
    password=getpass('New password (minimum 8 characters): ')
    if password!=getpass('Confirm password: '):raise SystemExit('Passwords do not match. No change made.')
    set_password(password)
    print('Password updated. Restart the server to apply and clear existing sessions.')
