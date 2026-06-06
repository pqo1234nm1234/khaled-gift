const SUPABASE_URL = "https://icabbwbpjnmwslozwukj.supabase.co";
const SUPABASE_KEY = "sb_publishable_nU_bK2HrpG-RhUTwkaAPeg_wRSHPVOE";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const WIN_CHANCE = 0.05;

const startBtn = document.getElementById("startBtn");
const lobby = document.getElementById("lobby");
const introScreen = document.getElementById("introScreen");
const videoContainer = document.getElementById("videoContainer");
const raceVideo = document.getElementById("raceVideo");
const engineSound = document.getElementById("engineSound");
const checkingScreen = document.getElementById("checkingScreen");
const resultScreen = document.getElementById("resultScreen");
const resultContent = document.getElementById("resultContent");

let deviceId = localStorage.getItem("device_id");

if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
}

startBtn.addEventListener("click", startGame);

async function startGame() {

    try {

        const { data: winnerRow } = await supabaseClient
            .from("game_status")
            .select("*")
            .eq("id", 1)
            .single();

        if (winnerRow && winnerRow.winner_exists) {
            showWinnerExists();
            return;
        }

        const { data: oldAttempt } = await supabaseClient
            .from("attempts")
            .select("*")
            .eq("device_id", deviceId);

        if (oldAttempt && oldAttempt.length > 0) {
            showUsedChance();
            return;
        }

        lobby.style.opacity = "0";

        setTimeout(() => {

            lobby.style.display = "none";

            introScreen.style.display = "flex";

            setTimeout(() => {

                introScreen.style.display = "none";

                startVideo();

            }, 2500);

        }, 800);

    } catch (error) {

        console.error(error);

        alert("حدث خطأ في الاتصال بقاعدة البيانات");

    }
}

function startVideo() {

    videoContainer.style.display = "block";

    raceVideo.currentTime = 0;
    engineSound.currentTime = 0;

    raceVideo.play().catch(() => {});
    engineSound.play().catch(() => {});

    setTimeout(() => {

        raceVideo.pause();

        finishRace();

    }, 9000);
}

async function finishRace() {

    engineSound.pause();
    engineSound.currentTime = 0;

    videoContainer.style.display = "none";

    checkingScreen.style.display = "flex";

    setTimeout(async () => {

        checkingScreen.style.display = "none";

        try {

            const { data: winnerRow } = await supabaseClient
                .from("game_status")
                .select("*")
                .eq("id", 1)
                .single();

            if (winnerRow && winnerRow.winner_exists) {
                showWinnerExists();
                return;
            }

            const isWinner = Math.random() < WIN_CHANCE;

            if (isWinner) {

                await supabaseClient
                    .from("game_status")
                    .update({
                        winner_exists: true,
                        winner_name: deviceId
                    })
                    .eq("id", 1);

                await supabaseClient
                    .from("attempts")
                    .insert({
                        device_id: deviceId,
                        result: "win"
                    });

                showPartyWin();

            } else {

                await supabaseClient
                    .from("attempts")
                    .insert({
                        device_id: deviceId,
                        result: "lose"
                    });

                showLoseScreen();

            }

        } catch (error) {

            console.error(error);

            alert("حدث خطأ أثناء فحص النتيجة");

        }

    }, 2500);
}

function showPartyWin() {

    resultScreen.style.display = "flex";

    resultContent.innerHTML = `
    <div class="partyWin">

        <div class="icon">🎉</div>

        <h1>لقد فزت بهدية خالد</h1>

        <p>برجاء إدخال بياناتك لاستلام الجائزة</p>

        <br>

        <input
            id="winnerName"
            type="text"
            placeholder="الاسم (اختياري)"
            style="
            width:80%;
            padding:15px;
            border:none;
            border-radius:15px;
            margin-bottom:15px;
            font-size:20px;
            text-align:center;
            ">

        <br>

        <input
            id="winnerPhone"
            type="tel"
            placeholder="رقم الهاتف *"
            style="
            width:80%;
            padding:15px;
            border:none;
            border-radius:15px;
            margin-bottom:15px;
            font-size:20px;
            text-align:center;
            ">

        <br>

        <button
            onclick="saveWinnerInfo()"
            style="
            padding:15px 40px;
            border:none;
            border-radius:15px;
            font-size:22px;
            font-weight:bold;
            cursor:pointer;
            ">
            إرسال البيانات
        </button>

    </div>`;
}
function showLoseScreen() {

    resultScreen.style.display = "flex";

    resultContent.innerHTML = `
        <div class="loseScreen">
            <div class="icon">🍀</div>
            <h1>حظ أوفر في المرة القادمة</h1>
            <p>لم يحالفك الحظ هذه المرة</p>
        </div>
    `;
}

function showWinnerExists() {

    resultScreen.style.display = "flex";

    resultContent.innerHTML = `
        <div class="winnerExists">
            <div class="icon">🏆</div>
            <h1>تم اختيار الفائز بالفعل</h1>
            <p>تابع الجروب لمعرفة الفائز</p>
        </div>
    `;
}

function showUsedChance() {

    resultScreen.style.display = "flex";

    resultContent.innerHTML = `
        <div class="usedChance">
            <div class="icon">🚫</div>
            <h1>لقد استخدمت فرصتك بالفعل</h1>
            <p>لا يمكن المشاركة أكثر من مرة</p>
        </div>
    `;
}



async function saveWinnerInfo() {

    const name =
        document.getElementById("winnerName").value.trim();

    const phone =
        document.getElementById("winnerPhone").value.trim();

    if (!phone) {

        alert("رقم الهاتف مطلوب");

        return;
    }

    const { error } = await supabaseClient
        .from("game_status")
        .update({
            winner_name: name || "بدون اسم",
            phone: phone
        })
        .eq("id", 1);

    if (error) {

        console.error(error);

        alert("حدث خطأ أثناء حفظ البيانات");

        return;
    }

    resultContent.innerHTML = `
    <div class="partyWin">
        <div class="icon">✅</div>
        <h1>تم تسجيل بياناتك بنجاح</h1>
        <p>سيتم التواصل معك قريبًا</p>
    </div>`;
}
