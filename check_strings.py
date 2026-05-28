import re,glob,codecs
files=[r'c:\WORKPLACE\TDTT\MAIN_TDTT_REACT\FE_TDTT_REACT\src\pages\HomePage.jsx',r'c:\WORKPLACE\TDTT\MAIN_TDTT_REACT\FE_TDTT_REACT\src\components\filter\FilterModal.jsx']+glob.glob(r'c:\WORKPLACE\TDTT\MAIN_TDTT_REACT\FE_TDTT_REACT\src\components\auth\*.jsx')
pat=re.compile(r'"([^\"]*)"|\'([^\']*)\'')
eng=[]
for f in files:
    text=codecs.open(f,encoding='utf-8').read()
    for m in pat.finditer(text):
        s=m.group(1) or m.group(2)
        if s and re.search(r'[A-Za-z]', s) and not re.search(r'[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]', s, re.I):
            if len(s)>1 and not s.strip().startswith(('{','[','<')):
                eng.append((f,s))
print('checked', len(files), 'files')
for f,s in eng:
    print(f, ':', s)
