import { melodys } from "./melodyData.js";

class MelodyApp {
    constructor() {
        //header
        this.$play = document.getElementById("play"); 
        this.$type = document.getElementById("option"); 
        this.$loop = document.getElementById("loop"); 
        this.$add  = document.getElementById("add"); 
        this.$del  = document.getElementById("delete"); 
        this.$key  = document.getElementById("key"); 
        this.$bpm  = document.getElementById("BPM"); 
        //box
        this.$box = document.getElementById("box");
        //fooder
        this.$export  = document.getElementById("export");
        this.$compile = document.getElementById("compile");

        //AudioContext
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        //変数
        this.key       = 0;
        this.bpm       = 60;
        this.bpmTime   = 1000 / (this.bpm/60);
        this.vol       = 0.05;
        this.isPlaying = false;
        this.current   = -1;
        this.storage   = JSON.parse(localStorage.getItem("storage"));

        this.scale     = 36; 
        this.cord      = "0x0x0x0";
        
        //CSS変数
        this.root = document.documentElement;
        this.style = getComputedStyle(this.root);
        this.color = this.style.getPropertyValue("--color").trim();
        this.lightColor = this.style.getPropertyValue("--lightColor").trim();
        this.darkColor = this.style.getPropertyValue("--darkColor").trim();
        this.darkColor = this.style.getPropertyValue("--darkColor").trim();
        this.borderColor = this.style.getPropertyValue("--borderColor").trim();


        this.bindUI();
        this.Compile(this.cord);
        this.renderBox();
        this.export();

        //console.log(this.storage);
    }

    bindUI(){

        //追加処理
        this.$add.addEventListener("click", ()=>{
            this.melody.push(BigInt(0));
            this.renderBox();
            this.export();
        });

        //削除処理
        this.$del.addEventListener("click", ()=>{
            if(this.melody.length <= 1) return;
            this.melody.pop();
            this.renderBox();
            this.export();
        });

        //音楽の再生
        this.$play.addEventListener("click", ()=> {
            if(!this.isPlaying){
                this.play();
            }else {
                //停止中スタイル
                this.$box.style.pointerEvents = "all";
                this.$play.textContent = "play_arrow";
                this.isPlaying = false;
            };
            
        });

        //key変更
        this.$key.addEventListener("input", ()=> {
            this.key = parseInt(this.$key.value, 10);
        });

        //BPM変更
        this.$bpm.addEventListener("input", ()=> {
            this.bpm = parseInt(this.$bpm.value, 10);
            this.bpmTime   = 1000 / (this.bpm/60);
        });

        //checkBoxイベント
        this.$box.addEventListener("input", (event)=> this.onCheck(event));

        //コンパイル(読み取り)
        this.$compile.addEventListener("click", ()=>{
            this.Compile(this.$export.value);
            this.renderBox();
        });

    }

    //音楽コードのコンパイル
    Compile(str){

        this.setStrage(str);

        //文字形式判別処理
        if(!/^([0-9A-Fa-f]{1,9}x)*[0-9A-Fa-f]{1,9}$/.test(str)){
            alert("※値が有効範囲外です。\n\nexample: ^([0-9A-Fa-f]{1,9}x)*[0-9A-Fa-f]{1,9}$");
            return;
        }

        //音楽コード配列化
        this.melody = str.split("x").map(i => 
            BigInt("0x"+i.padEnd(this.scale/4,"0")) & (BigInt(2)**BigInt(this.scale))-BigInt(1)
        );

        // console.log(this.melody);
    }

    //譜面の生成処理
    renderBox(){

        //boxリセット
        this.$box.innerHTML = "";

        //box設定
        const frag = document.createDocumentFragment();
        this.melody.forEach((Val, i)=>{

            //row設定
            const row = document.createElement("div");
            row.className = "row";
            row.id = `r${i+1}`;

            //checkBox設定
            for(let bit=0; bit<this.scale; bit++){
                const cb = document.createElement("input");

                //スタイル
                cb.type = "checkbox";
                cb.id = `r${i+1}b${bit+1}`;
                if(BigInt(Val) & (BigInt(1) << BigInt(this.scale-1-bit))) cb.checked = true;
                if([
                    1,3,6,8,10,
                    (12+1),(12+3),(12+6),(12+8),(12+10),
                    (2*12+1),(2*12+3),(2*12+6),(2*12+8),(2*12+10),
                ].includes(bit)){
                    cb.name = "blackKey";
                } 

                row.prepend(cb);
            }
            frag.append(row);
            // console.log(this.melody);

        });
        
        //box生成処理
        this.$box.prepend(frag);
    }

    //チェック検知
    onCheck(event){
        const m = event.target.id.match(/^r(\d+)b(\d+)$/);
        if(!m) return;
        const row = +m[1]-1;
        const bit = +m[2]-1;

        this.melody[row] ^= BigInt(1) << BigInt(this.scale-1-bit);
        this.export();
    }

    //エクスポート
    export(){
        const ex = this.melody.map(n =>
            BigInt(n) !== BigInt(0) ? n.toString(16).padStart(this.scale/4, "0").replace(/0*$/,"").toUpperCase() :"0"
        ).join("x");

        this.$export.value = ex;

        //保存
        this.setStrage(ex);

        return ex;
    }

    //ストレージ保存
    setStrage(str){
        //ストレージセット
        localStorage.setItem("storage", JSON.stringify({
            melody: str,
        }));
    }

    //再生
    play(){
        if(this.isPlaying) return;
        else{  
            //再生中のスタイル
            this.isPlaying = true;
            this.$box.style.pointerEvents = "none";
            this.$play.textContent = "stop";
            this.step(0);
        }
    }

    step(i){
        
        //ループ処理
        if(i >= this.melody.length){
            if(this.$loop.checked) i = 0;
            else {
                //停止中のスタイル
                this.isPlaying = false;
                this.$box.style.pointerEvents = "all";
                this.$play.textContent = "play_arrow";
                this.isPlaying = false;
                return;
            };
        }

        //前の音が範囲内の場合
        if(this.current >= 0){
            //プレイ中クラス削除
            this.$box.children[this.current].classList.remove("playing");
        }
        //プレイ中クラス追加
        this.$box.children[i].classList.add("playing");
        this.current = i;

        //音の設定
        const maskBase = BigInt(1) << BigInt(this.scale-1);
        for(let bit=0; bit<this.scale; bit++){

            //音声入力チェック
            if(
                this.melody[i] & (maskBase >> BigInt(bit)) && //その音がチェックされている場合
                (i === 0 || !(this.melody[i-1] & (maskBase >> BigInt(bit)))) //前の音がチェックされていない場合
            ){

                //音の長さの調節
                let run = 1;
                while(
                    i+run < this.melody.length && //次の音が範囲内の場合
                    this.melody[i+run] & (maskBase>>BigInt(bit)) //次の音がチェックされている場合
                ) run++; //その次にアクセス

                //音を鳴らす・音の長さの調節
                const Hz = 440*2**((bit-9+this.key)/12);
                this.sound(Hz, this.vol, this.bpmTime*run);
            }
        }

        //スタイル変更
        document.querySelectorAll(`#box > #r${i+1} > *`).forEach(id=>{


            id.style.borderWidth = "4px";
            id.style.borderColor = this.borderColor;
            if(id.checked) { 
                id.style.scale = "1.2";
            }
        })

        //次のサウンド
        setTimeout(() => {
            
            //スタイル変更
            document.querySelectorAll(`#box > #r${i+1} > *`).forEach(id=>{
                id.style.borderWidth = "2px";
                id.style.borderColor = this.darkColor;
                id.style.scale = "1";

            })
            
            //停止
            if(!this.isPlaying) return;
            this.step(i+1);

            //オートスクロール
            const targetPos = document.querySelector(`#box > #r${i+1}`).offsetLeft;
            document.getElementById("box").scrollTo({left:targetPos, behavior:"auto"});
      
        }, this.bpmTime);
    }

    sound(Hz, vol, time){

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = this.$type.value;
        osc.frequency.value = Hz;

        gain.gain.value = vol;
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start();
        setTimeout(() => osc.stop(), time);
    }

}

window.addEventListener("DOMContentLoaded", ()=> new MelodyApp());
