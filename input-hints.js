'use strict';

(() => {
  const texts = {
    'index.html': `
agent|想一想：成功完成一份簡報，能否證明它在所有陌生工作都能可靠地學習和應用？不要只看它會不會自己操作工具。
agent-reason|可寫：「我認為這項表現能／不能證明通用能力，因為＿＿。」指出這次展示的能力及仍不知道的部分。
case-a|看看它是按預先寫好的條件執行，還是從過往資料學習；不要只因為「自動」就選AI。
reason-a|找出情境中決定是否發券的條件，再說明這個條件如何運作。
case-b|留意系統如何作出預測：是否利用過往資料找規律？
reason-b|可寫：「它利用＿＿資料來＿＿，所以我這樣分類。」引用情境中的運作方法。
case-c|這段描述有沒有交代選收件人和產生內容的方法？資料不足時可以保留判斷。
reason-c|先分清「知道它做甚麼」和「知道它怎樣做」，指出題目欠缺哪一部分。
missing-c|問一項能幫助分類的資料，例如收件人如何選出，或內容如何產生。
case-revision|核對後寫你改了或保留了哪個判斷，以及原因；不是每個人都必須改答案。
rctc-0|這句是在指定工作角度、提供背景、交代要做甚麼，還是限制不能做甚麼？
rctc-1|留意店舖資料及目標對象，在這個任務中起甚麼作用。
rctc-2|留意這句有沒有指定要交付的成果及數量。
rctc-3|留意這句說明哪些內容不能自行加入，而不是要求新增一項成果。
constraint-purpose|想一想：不寫這項要求，AI可能補上甚麼？寫了以後，你又可以檢查甚麼？
demo-short|只貼課堂展示的短版prompt實際回答；沒有看見結果可留空，不需要自己編一個。
demo-full|只貼課堂展示的完整版prompt實際回答，保留原文；這欄是選填。
demo-difference|比較一段實際文字，例如有沒有自行加入優惠、是否問了缺少的資料；兩次沒有明顯差異也可照實寫。
count-input|每個標題另起一行，只貼要檢查的標題；工具輔助算中文字，但優惠、功效及語氣仍要自己核對。
tone|選你想測試的語氣，沒有唯一正確選項；之後要能說出你怎樣辨認這種語氣。
tone-criterion|把「語氣」變成看得見的特徵，例如句子長短、用詞是否直接或有沒有潮語。
my-prompt|可按「角色：＿＿；背景：＿＿；任務：＿＿；限制：＿＿」組織，再對照上方範本補上語氣、数量及字數要求。
first-output|把自己的prompt送到課堂允許的AI工具，再原樣貼回第一次回答；未取得就註明，不要改成理想答案。
check-number|數一數實際有多少個標題，做過檢查才勾選；發現不是3個也可以勾「已核對」，但要寫出問題。
check-length|逐一檢查正文中文字數及是否有英文、數字；勾選代表做過檢查，不代表全部合格。
check-content|檢查是否加入未提供的價格、優惠或健康功效；有問題也照實記錄，不要只看文案是否好聽。
first-evidence|用「要求是＿＿；原回答寫＿＿；所以符合／不符合＿＿」寫一項具體證據。
follow|想測語氣可選修改語氣；真的發現不符才選修正問題，不必為了追問而捏造錯誤。
repair-number|填實際有問題的標題編號1至3；選修改語氣時不需要這一欄。
repair-problem|引用實際問題，例如超字數或新增優惠；不要只寫「不好」，也不要編造原回答沒有的錯誤。
follow-prompt|在同一個AI對話送出具體修改要求，並說明其他限制保持不變；可用上方追問方式產生文字再核對。
second-output|原樣貼回追問後的實際回答；未取得結果就記原因，不要自行寫成AI結果。
comparison|用「原本寫＿＿，現在寫＿＿，改變是＿＿」比較；變好、變差或沒有變化都可以。
second-check|修改後重新檢查數量、字數、英文／數字及新增內容，再勾選；不要沿用第一次檢查結論。
second-evidence|指出修改後實際符合或不符合的要求，最好附上一段文字或字數。
exit-answer|分清「向AI提出限制」和「AI一定遵守限制」，想一想使用者還要做甚麼。
completion|按真實操作進度選，不以選「完成」當作好答案；只有拿到兩次實際結果才選已取得兩次。
blocker|寫清卡在哪一步，例如工具登入、等候回答或未完成第二次核對；已完成可列出做過的核對。
`,
    'recognition.html': `
face-choice|先保留你的猜測，A或B都可以；猜錯不等於沒學會，暫時不要找揭曉答案。
face-confidence|1代表很不確定，5代表很有把握；選當時真正的信心，不是選你希望拿到的分數。
face-observation|寫你真的看見的一項細節及它如何影響猜測；沒有具體理由可以寫「憑直覺」。
face-revision|揭曉後指出哪项發布來源或製作紀錄支持判斷；不要把原先猜測改成早已知道答案。
poem-choice|先按你的觀察猜A或B，不必認出作者；風格像古詩不等於來源已確定。
poem-confidence|依當時信心選1至5，揭曉後保留原評估。
poem-observation|可以寫用詞、句式或意象，也可以寫「憑直覺」；不要把有押韻直接當成作者證據。
poem-revision|看看揭曉提供的作品出處與製作紀錄，說明哪一項支持或改變你的判斷。
art-choice|先猜A或B；藝術經驗不足也可以參加，這不是畫家知識測驗。
art-confidence|選真正的信心程度，不確定可以選較低數字。
art-observation|寫一項看見的畫面特徵，例如物件或筆觸；觀察可以幫助猜測，但還不是來源證明。
art-revision|核對揭曉中的作品來源是否對應同一幅圖，再說明你的判斷有沒有改變。
reflect-round|選一個你最能說明判斷過程的回合，人臉、詩或畫作都可以。
before-reason|填揭曉前真正猜了甚麼及理由；可以回看已保留的原猜測。
source-reason|用「來源＿＿對應這份作品，所以支持／修正＿＿」說明，不要只寫「老師說的」。
next-evidence|想一項能回查的資料，例如原始發布頁或製作紀錄，並說明要比對的是同一份作品。
`,
    'generation.html': `
training-status|按實際結果來源選：自己操作、教師示例、試過未取得或尚未嘗試；不要把教師示例當成個人成果。
training-before|保留改客群前的實際標題；未取得可以註明，不用編造輸出。
training-after|保留改客群後的實際標題，方便與修改前比較。
training-observation|找新客群相關的實際用詞，寫它有沒有配合背景；沒有配合也可照實記錄。
training-choice|想一想：這次是改輸入要求，還是實際執行了更新模型參數的訓練？
training-reason|用自己的話區分「給已有模型新要求」與「讓模型重新學習並更新參數」。
token-count|按畫面中的方括號片段逐個數，包括句號；這題問指定例子，不問所有模型。
milk-count|只數「奶茶」對應的方括號片段，不要把一個詞直接當成一個token。
token-choice|頁面註明這是某種分詞方式的例子，想一想能否把它推廣到所有模型。
token-reason|可寫：「奶茶在語言上是＿＿個詞，但這個例子切成＿＿個token，所以＿＿。」
a-status|按回答A的實際來源及進度選，未取得也可以如實記錄。
a-output|複製prompt A到課堂允許的AI工具，貼回完整回答；沒有結果就寫未取得。
context-background|寫一個簡單虛構情境，例如地點、人物需要或正在做的事；不要填真實個人資料。
b-status|按回答B的實際來源及進度選，不要因A已完成就把B也記成完成。
b-output|使用含你自己背景的prompt B，在新對話測試，再貼回實際回答。
context-observation|用「我加入＿＿背景；回答寫＿＿；有／沒有配合，因為＿＿」組織。
repeat-status|按重問後的實際結果選，沒有取得第二次回答就照實註明。
repeat-output|貼第二次實際回答，不要為了展示差異而自行改文字。
repeat-observation|比較具體措辭及活動內容，相同、不同或完全相同都可以記錄。
repeat-constraint|分別看兩份是否各只有一句續寫、沒有額外解釋，並引用一項實際證據。
repeat-choice|這是虛構續寫任務，想一想是否可能有多個符合限制的接法。
repeat-reason|把「兩次文字相同／不同」與「事實已經查證」分開，說明若有事實還要查甚麼。
frame-slider|把滑桿依次移到起點、中間、末段，觀察哪些輪廓逐步出現；這是示意，不是即時生成。
diffusion-choice|想一想：示意是在找出藏好的指定照片，還是在逐步形成新的圖像？
diffusion-reason|用「從＿＿開始，根據學到的規律，逐步＿＿」說明，不需要寫數學公式。
image-status|按圖片的實際來源及進度選；教師示例與自己生成圖片要分開。
image-file|選你實際取得的圖片檔作本機預覽，沒有圖片可以不選；這裡不會自動上傳。
image-location|填真實檔名或保存位置，未取得就註明；選檔後可核對自動帶入的檔名。
image-check|對照prompt選一項看得見的條件，例如杯子或背景，再寫實際符合或不符合。
image-evidence|把「生成了一幅圖」與「真實店舖今天有售」分開，想一項店舖或實物證據。
order-1|先回看滑桿起點的狀態，再安排整個流程。
order-2|想一想起點到終點之間做了甚麼，這不是一步取出現成照片。
order-3|看滑桿最後一格形成了甚麼，再選流程終點。
`,
    'detective.html': `
source-url|打開指定來源，複製地址列的原文網址，不要只貼AI對話或搜尋結果頁。
source-read|自己讀到原文、只看教師截圖、無法讀取要分開選；有網址不等於讀過內容。
source-publisher|查看頁面標題、正文或頁尾，找出誰發布統計，不要填AI工具名稱。
source-date|找公報發布日期，不要把資料所屬年份當成發布日期；找不到就寫未能確認。
source-limit|寫真實讀取情況及限制，沒有問題可寫已成功讀取；不要假裝讀過未能開啟的內容。
demo-status|按課堂Demo實際回答來源選；未看到或未取得結果就照實記錄。
demo-output|保留教師示範的原回答，包括可能的錯誤；沒有看見則寫未取得。
unit-number|先想1 billion等於多少億，再把31.7按相同比例換算。
unit-reason|寫出換算關係和算式，不要只寫「因為老師說」。
wrong-reason|分開檢查「全部／網上零售」和「billion／億」，指出樣例混淆了哪一項。
a-status|選這次A題的真實操作狀態，不要把查到資料當成已取得AI回答。
a-output|貼AI原回答，不先改正數字；沒有取得就保留未取得狀態。
a-ai-source|AI真的附連結才記連結，沒有就寫未提供；別把自己找到的來源算成AI提供。
a-source|填你用來核對A題的原始公報網址，與AI原先有沒有給來源分開記。
a-read|依實際讀取方式選，只有搜尋摘要不能當成已讀原文。
a-publisher|從原文找發布統計的機構，不是轉貼網站或AI工具。
a-date|找這份公報的發布日期，與數據年份分開記。
a-year|找出資料是何年，並判斷是全年還是單月。
a-scope|對照A題到底問全部零售還是網上零售，定位相應原文段落。
a-number|抄與A題範圍吻合的原數字，不含單位，也不要先換算。
a-unit|連同原文的數量單位及幣別記下，不能只填「元」。
a-converted|把原數字由billion港元換成億港元，只填換算後數字。
a-version|看看原文說初步估計還是修訂值，不要把歷史公報當成永不變動的最終數據。
a-evidence|摘短句或清楚標成中文摘要，讓人能核對年份、範圍、數字及單位；未讀到則記限制。
a-reason|把AI原回答與原文逐項比較，指出一項實際吻合或不吻合；不要只抄標準數字。
consistency-choice|想一想同一個錯誤可不可以被說兩次，重複是否等於獨立證據。
consistency-reason|寫下一步要開哪份原文及核對哪個條件，而不是只說再問一次AI。
case-choice|先比對來源地區與問題地區，再看來源有沒有比較多家店的日期。
case-reason|分開指出「地區是否吻合」及「有沒有最早的比較證據」。
b-scope|先寫清地區、店舖類別、技術意思，以及「引入」指試驗還是實際使用。
b-status|按B題實際操作進度選，不要沿用A題的狀態。
b-output|保留B題AI原回答或未取得情況，不要把搜尋結果改寫成AI回答。
b-search|只記真正用過的搜尋詞，可加入地區、技術及日期等關鍵字。
b-url|記候選原始來源；非香港案例可以作排除依據，但不能直接支持香港最早。
b-publisher|在候選來源頁找發布者，找不到就寫未能確認。
b-date|記候選頁發布日期，另外留意是否交代實際引入日期；兩者可能不同。
b-read|只有讀到候選原文才選已讀；未找到或讀不到就照實選。
b-evidence|指出原文真正支持的地區、店舖、技術或日期，沒有原文則記讀取限制。
b-support|分兩句想：「它支持曾採用甚麼？」及「它有沒有足夠資料支持最早？」
b-gap|要證明最早，想一想還缺其他哪些候選及可比較的日期。
a-verdict|讀到支持原文可判已核實；找到具體不吻合可判有錯誤；證據不足保留未能確認。
a-verdict-reason|用年份、範圍、單位或版本的一項核對，支持你對實際AI回答的結論。
b-verdict|按真正取得的證據判斷，未能確認不等於已證明沒有店採用。
b-verdict-reason|分清已發現的具體錯誤和仍欠缺的比較證據，結論不要比證據更強。
personal-a|寫一項你親自核對的範圍或單位，以及為甚麼容易混淆。
personal-b|指出一項仍缺的日期或候選比較，而不是只說需要更多資料。
personal-consistency|用一個可能重複的錯誤解釋為甚麼仍要查原文。
follow-claim|引用實際回答中一項缺乏支持的說法，讓下一次追問有明確目標；沒有就照實註明。
`,
    'responsibility.html': `
risk-a|先看這是課堂虛構創作還是真實公開資訊，並想最直接要核對甚麼。
risk-a-reason|指出一項立即可做的檢查，並連結這個任務的要求。
risk-b|留意未提供證據的健康功效，以及它會不會影響讀者決定。
risk-b-reason|說明先做哪項保護行動，不能只讓同一AI再保證一次。
risk-c|留意輸入是否含真實可識別的個人資料，先想資料處理是否獲批准。
risk-c-reason|說出你會停止甚麼及改用甚麼安全樣例，不要在答案中貼真實姓名電話。
risk-transfer|公開後會影響真實讀者，想一項課堂草稿以外必須核實的資料或審核。
law-read|按真正看過的資料選：原文件、教師摘述／截圖或無法讀取。
law-choice|引用格式像真之外，想一想要找到甚麼文件，以及該文件是否真的支持說法。
law-step|寫出找原判例、定位相關段落及核對內容的步驟；讀不到就記限制與下一步。
deep-read|按自己的實際讀取狀態選，不要把聽過案例當成讀過原文件。
deep-choice|想一想可疑影音和訊息是否足以證明身分、付款要求及授權。
deep-channel|選不由可疑訊息新提供的獨立聯絡方法，並說明為甚麼它較可靠。
deep-question|寫一句同時確認誰提出、要求內容及誰有批准權的提問；只作角色扮演，不實際付款。
peer-mode|同學交換、自查、教師樣例與未取得紀錄要分開，按真實情況選。
peer-claim|只引用要核對的一項實際說法，移除姓名與個人資料；教師樣例須註明。
peer-url|填支持或反駁該說法的原始網址，沒有取得就記未取得。
peer-read|這次真正讀了甚麼就選甚麼，不能只因網址存在而選已讀原文。
peer-evidence|指出原文支持的位置、實際不吻合處或讀取限制，不要只寫可信或不可信。
peer-feedback-text|用「你寫＿＿；來源指出＿＿；建議核對／修改＿＿」；原文吻合也可寫未發現不符。
peer-received|記真正收到的回饋，自查就寫没有同學回饋；不要編造他人意見。
peer-revision|說明採納或保留的理由，再寫目前結論；不必為了修改而製造錯誤。
independent-prompt|可按「角色：＿＿；背景：貼上活動資料；任務：標題及通知正文；限制：字數、保留資料、不得新增、缺資料待確認」組織，再逐項對照上方要求。
independent-criteria|選兩項可以直接檢查的要求，例如資料吻合及沒有補登記網址；不要只寫內容要好。
output-status|按實際選自己輸出、等待、工具失效、教師實際輸出或尚未嘗試。
original-output|原樣保留實際回答，未取得就記狀態；不要先修好再當成原回答。
output-check-1|用「要求：＿＿；實際文字：＿＿；判斷：＿＿」核對第一項，引用自己的回答。
output-check-2|用同樣格式核對另一項，例如是否新增資料或符合字數，別只重複第一項。
repair-mode|依核對結果選追問、人手修正、保留原稿或只修prompt，沒有不符不必捏造問題。
repair-problem|有問題就引用原句及違反的要求，沒有就記保留理由；沒輸出時說明prompt欠缺甚麼。
repair-target|說清要刪除、改寫或待確認哪項資料，其他已提供的資料保持不變。
revision-status|只修prompt、等待修訂、取得修正版及保留原稿是不同狀態，要照實選。
revised-output|貼實際修正版，或記保留原稿的核對依據；未取得則寫目前限制。
revision-check|修正後重新查資料、限制及是否有新錯誤；未完成就指出哪項還沒查。
exit-image|把生成原理與真實商品證據分開，再解釋為甚麼一幅生成圖不能代替實物核實。
exit-topic|選你能用例子解釋的一題，三個選項都可以。
exit-generation|Token題比較詞與片段；背景題引用自己的實際回答；訓練題分清改输入和更新模型參數。
exit-risk|截止日期仍未確定時，想谁能確認，以及確認前如何避免發布虛構日期。
exit-rule|填「如果〔使用情境〕，我就先〔具體核對行動〕，因為〔原因〕」，不要只寫小心使用AI。
exit-incomplete|列真實未完成項目及下一步；完成者列出做過的核對，而不是只寫全部完成。
`
  };

  const examples = {
    'index.html': `
agent|例：「它能做這份PPT，但我還不知道它能否可靠地處理其他陌生任務。」
agent-reason|例：「會使用工具完成一項工作，不代表所有工作都能勝任。」
case-a|例：假設系統只按「逢星期一發券」執行，我會先看這是否固定規則。
reason-a|例：「判斷依據是預先設定的門檻，不是從顧客資料學出來的規律。」
case-b|例：假設模型用過去一年的訂單預測誰會回購，我會留意它從資料學習的部分。
reason-b|例：「它利用過往訂單找出回購規律，再預測新顧客。」
case-c|例：「只知道自動寄電郵，還不知道內容是固定範本還是模型產生。」
reason-c|例：「自動寄送只說明執行方式，沒有交代如何作判斷。」
missing-c|例：「它是按固定名單寄送，還是根據顧客資料預測收件人？」
case-revision|例：「我原本把自動化當成AI，現在會先問系統怎樣作出判斷。」
rctc-0|例：「你是圖書館助手」指定回答的工作角度，屬於Role。
rctc-1|例：「讀者是中一學生」提供對象資料，屬於Context。
rctc-2|例：「寫兩句借書提醒」指定要完成的成果，屬於Task。
rctc-3|例：「每句不超過20字」提供可核對的限制，屬於Constraints。
constraint-purpose|例：「如果AI自行寫『買一送一』，我可以用這項限制指出它加入了未提供的優惠。」
demo-short|例：沒有看見教師的實際回答時，可寫「未取得短版示範輸出」。
demo-full|例：沒有看見教師的實際回答時，可寫「未取得完整版示範輸出」。
demo-difference|例：若實際看到短版有「半價」而完整版沒有，可寫「短版新增優惠，完整版沒有」。
count-input|例：貼「奶茶相伴輕鬆一下」作一行，工具會計出8個中文字。
tone|例：我想測試短句和直接用詞，可以選「簡潔直接」。
tone-criterion|例：「我會看它是否用短句直接提到奶茶，而不是用誇張形容。」
my-prompt|例：「你是文案助手；為虛構山角奶茶寫3個中學生標題，語氣簡潔，各不超過15個中文字，不用英文或數字，不新增優惠，只列標題。」
first-output|例：若工具仍未回應，可寫「已送出prompt，尚未取得第一次回答」。
check-number|例：實際只看到2個標題時，做過檢查仍可勾選，再記「只有2個，不符合3個要求」。
check-length|例：若某標題有16個中文字，可記「第2個超過15字」，而不是不記這次檢查。
check-content|例：若原回答出現未提供的「第二杯半價」，可記為新增優惠。
first-evidence|例：若原回答真的有「奶茶相伴輕鬆一下」，可寫「有8個中文字，符合15字上限」。
follow|例：若第一次全部符合限制，但想試更親切的用詞，可以選「修改語氣」。
repair-number|例：若真正有問題的是第2個標題，就填2。
repair-problem|例：若第2個標題真的有16個中文字，可填「第2個超過15字」。
follow-prompt|例：「把3個標題改得更親切，其餘限制不變，只輸出修改後的標題。」
second-output|例：若追問還在等待，可寫「已追問，尚未取得第二次回答」。
comparison|例：若實際由「品嚐」改成「一起喝」，可寫「用詞改得較親切，但仍要核對其他限制」。
second-check|例：修改後雖然更親切，仍要再數3個標題及逐條核對字數。
second-evidence|例：若真的核對過，可写「第1個標題8字，沒有新增優惠」，並引用自己的新版。
exit-answer|例：「AI可能仍加入未提供的優惠，所以我不能只靠prompt，還要檢查回答。」
completion|例：只有第一份回答而追問仍在等待，就選「只取得第一次結果」。
blocker|例：「我已送出追問，但第二次回答仍在等待，所以還未完成第二次核對。」
`,
    'recognition.html': `
face-choice|例：「我先選A作猜測，但還沒有來源證據」；這只是填法，不是揭曉答案。
face-confidence|例：「我主要憑直覺，沒有把握，所以選2。」
face-observation|例：「我沒有足夠細節支持判斷，目前是憑直覺。」
face-revision|例：「我原本靠外觀猜，揭曉後改用相符的發布頁與製作紀錄作依據。」
poem-choice|例：「我先猜B，但『像古詩』只是印象」；這不是揭曉答案。
poem-confidence|例：「我對作者來源不熟悉，所以選1，表示很不確定。」
poem-observation|例：「兩首都有自然景物，所以我不能只靠題材分辨。」
poem-revision|例：「作品原文的出處比『我覺得有意境』更能支持作者判斷。」
art-choice|例：「我先選A，再記下理由，等揭曉後查來源」；這不是揭曉答案。
art-confidence|例：「我看得出畫面物件，但不知道創作來源，所以選2。」
art-observation|例：「我看到水面與植物，但這些物件本身不能證明由誰創作。」
art-revision|例：「我會比對博物館頁是否展示同一幅圖，而不只看畫風像不像。」
reflect-round|例：若人臉回合最令你改變想法，可以選「人臉」。
before-reason|例：「我原本猜A，理由是直覺」；請換成你真正保留的原猜測。
source-reason|例：「發布頁能對應同一張圖片，因此比單看外觀更有依據。」
next-evidence|例：「下次我會找原始發布頁，核對是否為同一份作品。」
`,
    'generation.html': `
training-status|例：若只是看教師示例，就選「教師示例」，不要選自己已取得輸出。
training-before|例：若沒有取得舊客群版本，可寫「未取得修改前的標題」。
training-after|例：若只取得第一版，可寫「新客群版本尚未取得」。
training-observation|例：若新回答實際提到「家長」，可寫「這個詞配合我改成家長的客群」。
training-choice|例：把「對中學生說」改成「對家長說」，是在改這次輸入要求，不是執行參數訓練。
training-reason|例：「我只是改了給已有模型的背景，沒有重新訓練模型。」
token-count|例：假設顯示[我][愛][貓]，逐個數是3個片段；本題請數畫面自己的例子。
milk-count|例：假設「紅茶」切成[紅][茶]，就有2個token；再用相同方法看本題的「奶茶」。
token-choice|例：一個分詞器把某詞切成兩段，不代表另一個分詞器一定一樣。
token-reason|例：「一個詞不一定是一個token，因為分詞器可以把它切成多個片段。」
a-status|例：若自己已送出prompt A但沒收到回答，就選「已嘗試，未取得輸出」。
a-output|例：沒有結果可寫「已送出A，尚未取得回答」，不要自行寫一句冒充AI輸出。
context-background|例：「主角在圖書館，需要保持安靜。」
b-status|例：若A已取得但B未送出，B仍應選「尚未嘗試」。
b-output|例：沒有結果可寫「尚未取得B」，有結果則原樣貼回。
context-observation|例：若B真的寫「安靜閱讀」，可寫「我加入圖書館背景，這個詞與背景配合」。
repeat-status|例：若重問後仍等待，選「已嘗試，未取得輸出」。
repeat-output|例：沒有第二次結果可寫「尚未取得重問回答」，不要為了比較而改寫第一次。
repeat-observation|例：若兩次原文完全相同，可寫「措辭和活動都相同」，不必製造差異。
repeat-constraint|例：若第二份多了「原因如下」，可記「多了額外解釋，不符合只續寫一句」。
repeat-choice|例：虛構故事可接「去散步」或「去閱讀」，不同不代表其中一句必定錯。
repeat-reason|例：「兩次都寫同一個數字，也可能只是重複同一個錯誤，仍要查原始資料。」
frame-slider|例：先移到起點看雜訊，再移到中間看輪廓，最後看形成的圖像。
diffusion-choice|例：想像逐步畫出一幅新圖，而不是從雜訊中抽出一張早已放好的照片。
diffusion-reason|例：「模型从雜訊開始，按學到的規律逐步形成圖像。」
image-status|例：若只觀察教師圖片，選「教師示例」，不要當成自己已生成圖片。
image-file|例：若真的存了「我的奶茶.png」，就選這個檔案作本機預覽。
image-location|例：若實際檔名是「我的奶茶.png」，就填這個名稱；沒有檔案就寫未取得。
image-check|例：若自己的圖真的有透明杯，可寫「透明杯符合prompt要求」。
image-evidence|例：「我要看店舖當日商品資訊或向店舖核實，不能只看生成圖。」
order-1|例：先找流程的起點，如同做飯要先準備材料，不從成品開始。
order-2|例：中間一步要寫由起點逐步改變的過程，不是直接跳到成品。
order-3|例：最後一步記形成的結果，並記住生成結果不等於真實照片。
`,
    'detective.html': `
source-url|例：「我打開公報後，複製這份原文的完整網址」，而不是填「Google找到」。
source-read|例：若只讀教師提供的原文截圖，就選截圖，不選自己成功打開網頁。
source-publisher|例：若原文由政府統計機構發布，就記該機構，不記「Gemini」。
source-date|例：假設一份2025年發布的公告介紹2024年數據，發布日期仍記2025年的日期。
source-limit|例：「網址存在，但本次網頁未能載入，我只看了教師截圖。」
demo-status|例：若看的是教師保存的真實AI回答，就選教師實際回答；預備文字不算實測。
demo-output|例：若沒有看到Demo原回答，就填「未取得教師Demo原回答」。
unit-number|例：1.2 billion港元等於12億港元；本題用相同換算方法。
unit-reason|例：「1 billion＝10億，所以原數字要乘10。」
wrong-reason|例：「網上銷售只是全部零售的一部分，不能把兩個範圍直接互換。」
a-status|例：若只有查原文，沒有操作AI，AI回答狀態仍選「尚未嘗試」。
a-output|例：若AI原本寫錯單位，仍貼原文，再在核對欄指出錯誤。
a-ai-source|例：「AI沒有提供來源」；自己後來找到的網址另填在核對來源欄。
a-source|例：「這是我自己打開並用來核對的原始公報網址」，不要只貼搜尋頁。
a-read|例：只看搜尋摘要時，不應記成自己成功讀取原文。
a-publisher|例：若正文寫「統計處發布」，發布者就記統計處，而不是AI工具。
a-date|例：假設頁面標示2025-02-03發布，日期欄就按該格式記錄。
a-year|例：假設原文說「2024年全年」，就記全年，而不是「2024年12月」。
a-scope|例：假設題目問全部零售，不應用只講網上零售的段落作答案。
a-number|例：假設原文是24.6 billion港元，原數字欄只填24.6。
a-unit|例：假設原文寫24.6 billion港元，單位欄寫「billion港元」，不只寫港元。
a-converted|例：假設原數字24.6 billion港元，換算後的億港元只填246。
a-version|例：原文若說「初步估計」，就記初步，不自行改成最終數字。
a-evidence|例：「中文摘要：原文說某年全年全部零售初步為某數字及單位」，再換成真正讀到的資料。
a-reason|例：若AI寫全年而來源只講單月，可記「時間範圍不吻合」。
consistency-choice|例：把同一算式算錯兩次，不會令它變正確。
consistency-reason|例：「我會開原始公報核對年份、範圍與單位，不只重問一次AI。」
case-choice|例：台灣某店的資料不能直接證明香港某店最早採用。
case-reason|例：「地區不同，而且原文沒有比較香港其他店的引入日期。」
b-scope|例：「我只查香港便利店的實際使用日期，先不把其他地區或普通電子貨架混入。」
b-status|例：若B題已送出但等待回答，就按B題選未取得，不沿用A題完成狀態。
b-output|例：若尚未收到B題回答，可寫「已送出問題，尚未取得結果」。
b-search|例：若真的搜尋過，可記「香港 便利店 AI 智能貨架 引入 日期」。
b-url|例：若只找到台灣案例，可記該網址及「用來排除地區，不支持香港最早」。
b-publisher|例：若候選來源是店舖官方新聞稿，就記發布新聞稿的公司名稱。
b-date|例：「新聞稿7月發布，但未交代引入日期」，兩件事要分開記。
b-read|例：候選頁打不開時，就記不能讀取，不把搜尋摘要當成原文。
b-evidence|例：「原文支持這家店曾採用某技術，但沒有說香港最早。」
b-support|例：「有採用紀錄，只能支持曾採用；沒有其他店日期，仍不能支持最早。」
b-gap|例：「還缺其他香港候選店的引入日期，才能比較誰較早。」
a-verdict|例：若讀不到原文，先選「未能確認」，不要因數字看起來合理就選已核實。
a-verdict-reason|例：「原回答的全年範圍與原文單月範圍不吻合，所以我指出範圍錯誤。」
b-verdict|例：若只有非香港案例而缺香港比較資料，可先記「未能確認」。
b-verdict-reason|例：「目前來源只支持另一地區的案例，不足以確認香港最早。」
personal-a|例：「我核對了billion換成億要乘10，避免把單位抄錯。」
personal-b|例：「還缺其他符合技術定義的店舖日期，不能只看一家新聞稿。」
personal-consistency|例：「AI可能兩次都把網上零售當成全部零售，所以一致不等於已查證。」
follow-claim|例：若AI真的寫「某店是香港最早」，就引用這句並追問比較日期的原始資料。
`,
    'responsibility.html': `
risk-a|例：虛構店的課堂標題可先核對數量和字數，不把它當成已核實的真實廣告。
risk-a-reason|例：「我先數是否有3個標題，再看有沒有超字數或自行加優惠。」
risk-b|例：若沒有證據支持「喝這杯可治療失眠」，先不要把這句公開發布。
risk-b-reason|例：「先移除未支持的健康聲稱，再交負責人核對證據及審核。」
risk-c|例：一份含真實姓名與電話的客戶名單，不應直接貼到未獲批准的工具。
risk-c-reason|例：「我先不貼真實資料，改用完全虛構的顧客樣例。」
risk-transfer|例：「改成公開廣告後，我會確認真實價格、優惠及產品資料，再交負責人審核。」
law-read|例：若只看教師中文摘述，就選摘述／截圖，不選已讀法院原文件。
law-choice|例：引用寫得像正式判例，我仍要查該判例是否存在及內容是否支持。
law-step|例：「先找原判例，再找被引用段落；找不到就記未能確認，暫不採用。」
deep-read|例：沒有成功開啟政府原文件時，就按實際選無法讀取或教師摘述。
deep-choice|例：即使影音很像主管，遇到新付款要求仍先暫停並獨立核實。
deep-channel|例：「我用原本已保存的主管聯絡方式，不用可疑訊息剛提供的新號碼。」
deep-question|例：「請確認這個新帳戶付款要求是否由你發出，以及誰已批准。」
peer-mode|例：若沒有同學交換，只核對自己紀錄，就選「自查，尚未完成互查」。
peer-claim|例：假設老師提供「全年全部零售31.7億」作錯誤樣例，要註明教師樣例，不冒稱同學答案。
peer-url|例：「這是我用來核對該數字的原始公報網址」，不是沒有相關內容的首頁。
peer-read|例：本次只看教師原文截圖，就按截圖記錄，不冒稱自己開過原頁。
peer-evidence|例：若說法寫全年而原文只講單月，可記「時間範圍不吻合」。
peer-feedback-text|例：「你寫全年，但來源只講12月；建議找全年段落再核對。」
peer-received|例：「這次是自查，沒有收到同學回饋。」
peer-revision|例：「我採納範圍不吻合的提醒，改查全年資料，再重寫結論。」
independent-prompt|例：「你是校園文案助手，依上方虛構資料寫標題與通知，正文不超120個中文字，不新增年份、星期或網址，登記方法寫待確認。」
independent-criteria|例：「①日期時間地點吻合；②正文不超120個中文字，沒有自行補登記網址。」
output-status|例：若已送出自己的prompt但仍等待，就選「已送出，尚未取得輸出」。
original-output|例：尚未取得時可寫「等待第一次通知回答」，不要抄示例當成個人AI輸出。
output-check-1|例：若實際通知寫B203，可記「要求B203；原文B203；地點吻合」。
output-check-2|例：若實際通知寫「登記方法待確認」且沒加網址，可記這項限制符合。
repair-mode|例：若逐項核對沒有不符，就選保留原稿，不需要製造錯誤來修正。
repair-problem|例：若原回答真的新增網址，可寫「加入了未提供的登記網址」。
repair-target|例：針對真的新增網址，可寫「刪除網址，登記方法改為待確認，其他資料不變」。
revision-status|例：若只改了prompt而沒有新輸出，就選只修prompt，不能記已取得修訂輸出。
revised-output|例：若沒有發現不符，可寫「保留原稿，日期、地點與不得新增資料均已核對」。
revision-check|例：若修正版真的刪了網址，可再記「已刪網址，但仍要重新檢查字數及活動資料」。
exit-image|例：「生成圖可以畫出店裏沒有的飲品，所以還要查真實商品證據。」
exit-topic|例：若能用「奶茶」解釋詞與token的分別，就選token題。
exit-generation|例：選訓練題可寫「改背景是在使用已有模型，沒有執行更新參數的訓練」。
exit-risk|例：「我先找活動負責人確認截止日期，未確認前不自行填入通知。」
exit-rule|例：「如果我要發布AI給的數字，我就先查原始來源與單位，因為流暢不等於正確。」
exit-incomplete|例：「通知已核對，但還未完成同學互查，下一步要交換一項說法及證據。」
`
  };

  function addHints() {
    const filename = decodeURIComponent(location.pathname).split('/').pop() || 'index.html';
    if (!texts[filename]) return;
    const hints = new Map(texts[filename].trim().split('\n').map(line => {
      const split = line.indexOf('|');
      return [line.slice(0, split), line.slice(split + 1)
        .replaceAll('数量', '數量').replaceAll('哪项', '哪項')
        .replaceAll('没有', '沒有').replaceAll('输入', '輸入').replaceAll('谁', '誰')];
    }));
    const seen = new Set();
    const sampleMap = new Map(examples[filename].trim().split('\n').map(line => {
      const split = line.indexOf('|');
      return [line.slice(0, split), line.slice(split + 1).replaceAll('可写', '可寫').replaceAll('模型从', '模型從')];
    }));
    for (const control of document.querySelectorAll('main input, main select, main textarea')) {
      if (control.readOnly || control.type === 'hidden') continue;
      const key = control.type === 'radio' ? control.name : control.id;
      if (!hints.has(key) || seen.has(key)) continue;
      seen.add(key);
      const group = control.type === 'radio' ? control.closest('fieldset') : null;
      const anchor = group || control.closest('label') || control;
      const title = group?.querySelector('legend')?.textContent
        || control.closest('label')?.querySelector('span')?.textContent
        || control.closest('label')?.textContent.trim() || key;
      const details = document.createElement('details');
      details.className = 'input-hint';
      details.dataset.hintFor = key;
      details.id = 'hint-' + key;
      const summary = document.createElement('summary');
      summary.textContent = '提示';
      summary.setAttribute('aria-label', title + '：提示');
      const paragraph = document.createElement('p');
      paragraph.id = 'hint-text-' + key;
      paragraph.textContent = hints.get(key);
      const example = document.createElement('p');
      example.className = 'hint-example';
      example.id = 'hint-example-' + key;
      example.textContent = sampleMap.get(key);
      details.append(summary, paragraph, example);
      anchor.after(details);
      const controls = group ? group.querySelectorAll('input[type="radio"]') : [control];
      for (const item of controls) {
        const describedBy = new Set((item.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
        describedBy.add(paragraph.id);
        describedBy.add(example.id);
        item.setAttribute('aria-describedby', [...describedBy].join(' '));
        item.setAttribute('aria-details', details.id);
      }
    }
  }

  // Wait for the existing page scripts to finish constructing their fields.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addHints, {once: true});
  else addHints();
})();
