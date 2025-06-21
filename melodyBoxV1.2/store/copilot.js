class MelodyApp {
  constructor() {
    // 要素キャッシュ
    this.$grid    = document.getElementById("box");
    this.$out     = document.getElementById("outputMelody");
    this.$add     = document.getElementById("add");
    this.$del     = document.getElementById("delete");
    this.$compile = document.getElementById("compile");
    this.$key     = document.getElementById("key");
    this.$bpm     = document.getElementById("BPM");
    this.$opt     = document.getElementById("option");
    this.$loop    = document.getElementById("loop");
    this.$playBtn = document.getElementById("button");

    // AudioContext
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // 初期設定
    this.key     = 0;          // トランスポーズ
    this.bpm     = 60;
    this.bpmTime = 1000/(this.bpm/60);
    this.vol     = 0.05;
    this.isPlaying = false;
    this.current   = -1;

    // 初期コンパイル＋UI バインド
    this.compile(this.$out.value || "0");
    this.bindUI();
  }

  // === UI バインド ===
  bindUI() {
    this.$compile.addEventListener("click", ()=> this.compile(this.$out.value));
    this.$add    .addEventListener("click", ()=> {
      this.melody.unshift(0);
      this.renderGrid();
      this.output();
    });
    this.$del    .addEventListener("click", ()=> {
      if (this.melody.length > 1) this.melody.pop();
      else this.melody[0] = 0;
      this.renderGrid();
      this.output();
    });
    this.$grid.addEventListener("input", e => this.onCheck(e));
    this.$key.oninput = ()=> {
      this.key = this.clamp(+this.$key.value, -24, 24);
    };
    this.$bpm.oninput = ()=> {
      this.bpm = this.clamp(+this.$bpm.value, 30, 240*4);
      this.bpmTime = 1000/(this.bpm/60);
    };
    this.$playBtn.addEventListener("click", ()=> this.play());
  }

  // === 文字列からビット列整数配列に変換 & グリッド描画 ===
  compile(str) {
    if (!/^([0-9A-Fa-f]{1,6}x)*[0-9A-Fa-f]{1,6}$/.test(str)) {
      return alert("フォーマット不正");
    }
    this.melody = str
      .split("x")
      .map(h => parseInt(h, 16) & 0xFFFFFF);
    this.renderGrid();
    this.output();
  }

  // === 現在の melody を textarea に16進文字列で出力 ===
  output() {
    const out = this.melody
      .map(n => n ? n.toString(16) : "0")
      .join("x");
    this.$out.value = out;
    return out;
  }

  // === グリッド（行×24ビット）を再描画 ===
  renderGrid() {
    this.$grid.innerHTML = "";
    const frag = document.createDocumentFragment();

    this.melody.forEach((val, i) => {
      const row = document.createElement("div");
      row.className = "row";
      for (let bit = 0; bit < 24; bit++) {
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id   = `r${i+1}b${bit+1}`;
        if (val & (1 << (23 - bit))) cb.checked = true;
        row.append(cb);
      }
      frag.append(row);
    });

    this.$grid.append(frag);
  }

  // === チェックボックス入力でビット反転 ===
  onCheck(e) {
    const m = e.target.id.match(/^r(\d+)b(\d+)$/);
    if (!m) return;
    const row = +m[1] - 1;
    const bit = +m[2] - 1;
    this.melody[row] ^= 1 << (23 - bit);
    this.output();
  }

  // === 再生ボタン ===
  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.step(0);
  }

  // === ステップ再生ループ ===
  step(i) {
    // 終端
    if (i >= this.melody.length) {
      if (this.$loop.checked) i = 0;
      else return this.isPlaying = false;
    }

    // 前の行ハイライト解除
    if (this.current >= 0) {
      this.$grid.children[this.current].classList.remove("playing");
    }

    // 今の行ハイライト
    this.$grid.children[i].classList.add("playing");
    this.current = i;

    // 音を鳴らす
    const maskBase = 1 << 23;
    for (let bit = 0; bit < 24; bit++) {
      if (this.melody[i] & (maskBase >> bit)) {
        // 伸ばし判定
        let run = 1;
        while (
          i + run < this.melody.length &&
          this.melody[i + run] & (maskBase >> bit)
        ) run++;
        const freq = 440 * 2 ** ((bit - 9 + this.key) / 12);
        this.playOne(freq, this.vol, this.bpmTime * run);
      }
    }

    // 次のステップ
    setTimeout(() => this.step(i + 1), this.bpmTime);
  }

  // === １音鳴らすヘルパー ===
  playOne(freq, vol, time) {
    const osc = this.audioCtx.createOscillator();
    osc.type = this.$opt.value;
    osc.frequency.value = freq;
    const gain = this.audioCtx.createGain();
    osc.connect(gain).connect(this.audioCtx.destination);
    gain.gain.value = vol;
    osc.start();
    setTimeout(() => osc.stop(), time);
  }

  // === 値 clamp ヘルパー ===
  clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
}

// DOM ができたら起動
window.addEventListener("DOMContentLoaded", () => new MelodyApp());