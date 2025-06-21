const melodys = {
    a: "884x091x091x884x244x884x884x884",
    b: "85x85x89xA1x89",
    c: "0x0x0x0",
}

import { melody_3_1 } from "/test.js";

const setMelody = melody_3_1;

let melody = setMelody.split("x").map(str => parseInt(str.padEnd(6, "0"), 16).toString(2).padStart(24, "0").split("").map(num=>parseInt(num, 10)));


//音楽コードのコンパイル
function melodyCompile(value) {

    //文字形式判別処理
    if(!/^([0-9A-Fa-f]{1,6}x)*[0-9A-Fa-f]{1,6}$/.test(value)){
        alert("※値が有効範囲外です。\n\nexample: ^([0-9A-Fa-f]{1,6}x)*[0-9A-Fa-f]{1,6}$");
        return;
    }

    //一時削除
    for (let i=1;i<melody.length;i++) adCheckBox("delete", i+1);
    //コンパイル
    melody = value.split("x").map(str => parseInt(str.padEnd(6, "0"), 16).toString(2).padStart(24, "0").split("").map(num=>parseInt(num, 10)));
    //checkBox生成
    for (let i=1;i<melody.length;i++) adCheckBox("add", i+1);
    melodyRoad();
    refresh();

    checkBoxReload();
}

//音楽データの文字出力(0000x0000)
function melodyOutput() {
    let value = "";

    //2進数配列 => 16進数音楽コードへ
    value = melody.map(i=>{
        let hex = parseInt(i.join(""), 2).toString(16).padStart(6, "0");
        return hex == 0 ? 0 : hex.replace(/0+$/, "");
    }).join("x");

    //データロード
    document.getElementById("outputMelody").value = value;
    return value;
}

//checkBoxリフレッシュ
function adCheckBox(value ,num) {

    //deleteなら削除処理
    if(value == "delete"){
        document.getElementById(`box_${num}`).remove();

    //addなら生成処理
    }else if(value == "add") {
        let checkBox = "";
        Array.from({length:24},(_,i)=> checkBox += `<input type="checkbox" id="_${24-i}">`);
        document.querySelector(`#box`).insertAdjacentHTML(
            "beforeend",`<div id="box_${num}">${checkBox}</div>`
        );
    }

    //リロード
    checkBoxReload();
}

//checkBoxの初期化
for (let i=0; i<melody.length; i++){
    adCheckBox("add", i+1)
}

//cheackBoxのチェック
const boxElement = document.getElementById("box");
function melodyRoad() {

    //checkBoxのアクセス
    for(let i=1; i<=melody.length; i++)for(let j=1; j<=melody[i-1].length; j++){

        //チェック処理
        const checkeBox = document.querySelector(`#box_${i} > #_${j}`);
        checkeBox.checked = melody[i-1][j-1] ? true:false;
    }
}

//checkBoxの入力
function melodyInput() {

    //melody配列のアクセス
    for(let i=1; i<=melody.length; i++)for(let j=1; j<=melody[i-1].length; j++){

        //音楽配列の入力処理
        const checkeBox = document.querySelector(`#box_${i} > #_${j}`);
        melody[i-1][j-1] = checkeBox.checked ?1:0;
    }
}

//checkBoxのリロード処理
function checkBoxReload(){

    //それぞれの列にアクセス
    document.querySelectorAll("#box > * > *").forEach(i =>{
        i.addEventListener("input", ()=>{
            refresh();
            melodyOutput();
        })
    });
}

//リフレッシュ
function refresh() {
    melodyInput();
    melodyOutput();
}
checkBoxReload();
melodyRoad();
refresh();

//キー入力
document.addEventListener("keydown", (event)=>{
    const key = event.key;
})

//checkBoxの削除
document.getElementById("delete").addEventListener("click", ()=>{

    //checkBoxが1つの場合
    if(melody.length == 1) {

        //リセット処理
        document.getElementById("outputMelody").value = 0;
        melody[0] = Array(24).fill(0);
        melodyRoad();
        return;
    }

    //checkBoxの削除処理
    adCheckBox("delete", melody.length);
    melody.pop();
    refresh();
})

//checkBoxの追加
document.getElementById("add").addEventListener("click", ()=>{

    //checkBoxの追加処理
    adCheckBox("add", melody.length+1);
    melody.unshift(Array(24).fill(0));
    refresh();
})

//音楽データ読み込み
const textArea = document.getElementById("outputMelody");
const compileButton = document.getElementById("compile");
compileButton.addEventListener("click",()=>{
    melodyCompile(textArea.value);
})

//Keyの変更
const keyChangeElement = document.getElementById("key");
let melodyKey = 0;
keyChangeElement.addEventListener("input", ()=>{

    melodyKey = parseInt(keyChangeElement.value ? keyChangeElement.value:0, 10);
    const range = 24;

    //値が範囲内かどうかを調べる
    if(melodyKey < -range || melodyKey > range){

        keyChangeElement.value = melodyKey < -range ? -range: range;
        alert(`※値が範囲外です:/\n-${range}~${range}`);
        return;
    }else if(!melodyKey) keyChangeElement.value = 0;

})

//BPMの変更
const BPMElement = document.getElementById("BPM");
let BPM = 60;
let BPMTime = 1000/(BPM/60);
BPMElement.addEventListener("input", ()=>{

    BPM = parseInt(BPMElement.value ? BPMElement.value:0, 10);
    const range = 240*4;

    //値が範囲内かどうかを調べる
    if(BPM < 30 || BPM > range){

        BPMElement.value = BPM < 30 ? 30: range;
        alert(`※値が範囲外です:/\n${30}~${range}`);
        return;
    }else if(!BPM) BPMElement.value = 60;

    BPMTime = 1000/(BPM/60);
})

//曲の再生
document.getElementById("button").addEventListener("click", ()=>{
    melodyCounter(0);
})


//AudioContextを作成
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function melodyPlay(Hz, vol, time) {

    //オシレーターを作成（音の発生源）
    const oscillator = audioCtx.createOscillator();
    oscillator.type = document.getElementById("option").value;
    oscillator.frequency.value = Hz;
    
    //ゲインノードを作成（音量調整）
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination); 

    // gainNode.gain.setValueAtTime(0, audioCtx.currentTime); // 音をゼロから開始
    // gainNode.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.05); // 50msかけて音量増加
    // gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + time/1000); // フェードアウト

    //音を鳴らす
    oscillator.start();
    
    //消音
    setTimeout(() => oscillator.stop(), time);
}


//オルゴールカウンター
function melodyCounter(i) {

    //音楽ループ処理
    if(melody?.[i] === undefined){
        if(document.getElementById("loop").checked) i = 0;
        else refresh;
    }

    //音声出力の処理
    for(let j=0;j<24;j++) if(melody?.[i]?.[j] && !melody?.[i-1]?.[j]){
        
        //伸ばし音
        let ratio = 1;
        while(melody?.[i+ratio]?.[j]) ratio++;
        
        console.log(ratio);
        //音声再生
        melodyPlay(440*(2**((j-9+melodyKey)/12)), 0.05, BPMTime*ratio);
    }

    //スタイル処理
    const checkBox = document.querySelectorAll(`#box > div[id*="_${i+1}"] > *`);
    checkBox.forEach(id =>{
        id.style.borderWidth = "5px";
        id.style.borderColor = "blue";
    });

    //次への処理
    setTimeout(() =>{
        melodyCounter(i+1, BPMTime);
        checkBox.forEach(id =>{
            id.style.borderWidth = "2px";
            id.style.borderColor = "darkblue";
        });
    },BPMTime);

}
