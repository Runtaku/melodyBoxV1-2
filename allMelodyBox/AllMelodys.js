class AllMelodys {
    constructor(){
        //
        this.$button = document.getElementById("button");
        this.$bpm    = document.getElementById("bpm");

        //
        this.$cord = document.querySelectorAll("#cord");
        this.$type = document.querySelectorAll("#type");
        this.$key  = document.querySelectorAll("#key");

        //AudioContext
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        //変数
        this.scale     = 32;
        this.vol       = 0.05;
        this.key       = -1;



        //初期処理
        this.bindUI();
    }
    
    bindUI(){
        this.$button.addEventListener("click", ()=>{
            this.step(0, 0, this.Compile(
                this.$cord[0].value   
            ), "square", 0);
            this.step(1, 0, this.Compile(
                this.$cord[1].value
            ), "square", 1);
        });

    }

    //音楽コードのコンパイル
    Compile(str){

        //文字形式判別処理
        if(!/^([0-9A-Fa-f]{1,9}x)*[0-9A-Fa-f]{1,9}$/.test(str)){
            alert("※値が有効範囲外です。\n\nexample: ^([0-9A-Fa-f]{1,9}x)*[0-9A-Fa-f]{1,9}$");
            return 0;
        }

        //音楽コード配列化
        return str.split("x").map(i => 
            BigInt("0x"+i.padEnd(this.scale/4,"0")) & (BigInt(2)**BigInt(this.scale))-BigInt(1)
        );

    }

    step(num, i, melody){

        this.bpm       = parseInt(this.$bpm.value, 10);
        this.bpmTime   = 1000 / (this.bpm/60);

        //音の設定
        const maskBase = BigInt(1) << BigInt(this.scale-1);
        for(let bit=0; bit<this.scale; bit++){

            //音声入力チェック
            if(
                melody[i] & (maskBase >> BigInt(bit)) && //その音がチェックされている場合
                (i === 0 || !(melody[i-1] & (maskBase >> BigInt(bit)))) //前の音がチェックされていない場合
            ){

                //音の長さの調節
                let run = 1;
                while(
                    i+run < melody.length && //次の音が範囲内の場合
                    melody[i+run] & (maskBase>>BigInt(bit)) //次の音がチェックされている場合
                ) run++; //その次にアクセス

                //音を鳴らす・音の長さの調節
                const Hz = 440*2**((bit-9+parseInt(this.$key[num].value, 10))/12);
                this.sound(this.$type[num].value, Hz, this.vol, this.bpmTime*run);
            }
        }

        //次のサウンド
        setTimeout(() => {
            
            //停止
            if(i >= melody.length - 1) return;
            this.step(num, i+1, melody, type, key);
      
        }, this.bpmTime);
    }

    sound(type, Hz, vol, time){

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.value = Hz;

        gain.gain.value = vol;
        osc.connect(gain).connect(this.audioCtx.destination);
        osc.start();
        setTimeout(() => osc.stop(), time);
    }
    
}

window.addEventListener("DOMContentLoaded", ()=> new AllMelodys());