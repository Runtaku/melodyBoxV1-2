const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

//fieldの大きさ
const fieldWidth = 20;
const fieldHeight = 30;


//field配列
const field = Array.from({length: fieldHeight},(_,i)=>Array(fieldWidth).fill(0));

const fieldClear = ()=>{
    for(let i=0;i<fieldHeight;i++)for (let j=0;j<fieldWidth;j++){
        field[i][j] = i >= fieldHeight-2 ? 1 : j == 0 || j == fieldWidth-1 ? 1 : 0;
    }
}

//minoオブジェクト
const sampleMino = {
    // testMino: {
    //     x: 1,
    //     y: 0,
    //     shap: [
    //         [1,1,1],
    //         [1,1,1],
    //         [1,1,1],
    //         [1,1,1],
    //     ]
    // },
    iMino: {
        x: 1,
        y: 0,
        shap: [
            [0,1,0,0],
            [0,1,0,0],
            [0,1,0,0],
            [0,1,0,0],
        ],
    },
    oMino: {
        x: 1,
        y: 0,
        shap: [
            [1,1],
            [1,1],
        ],
    },
    sMino: {
        x: 1,
        y: 0,
        shap: [
            [1,0,0],
            [1,1,0],
            [0,1,0],
        ],
    },
    zMino: {
        x: 1,
        y: 0,
        shap: [
            [0,1,0],
            [1,1,0],
            [1,0,0],
        ],
    },
    jMino: {
        x: 1,
        y: 0,
        shap: [
            [1,1,0],
            [1,0,0],
            [1,0,0],
        ],
    },
    lMino: {
        x: 1,
        y: 0,
        shap: [
            [1,1,0],
            [0,1,0],
            [0,1,0],
        ],
    },
    tMino: {
        x: 1,
        y: 0,
        shap: [
            [0,1,0],
            [1,1,0],
            [0,1,0],
        ],
    },

};


//セルの大きさ
const cellSize = 20;
canvas.width = cellSize*fieldWidth;
canvas.height = cellSize*fieldHeight;


//fieldを描写
const drowField = () =>{
    //全fieldアクセス
    for(let i=0;i<fieldHeight;i++)for (let j=0;j<fieldWidth;j++){
        const value = field[i][j];

        //外側で1:空色
        //内側で1:灰色
        //それ以外:白色
        ctx.fillStyle =
         i > field.length-3 || (j == 0 || j == fieldWidth-1) ? "skyblue":
         value ? "gray" : "white";

        //描写
        ctx.fillRect(j*cellSize, i*cellSize, cellSize, cellSize);
    }
    drowMino(nowMino.mino);
}

//minoを描写
const drowMino = (mino) =>{
    //ミノ描写
    for(let i=0;i<mino.shap.length;i++)for (let j=0;j<mino.shap[i].length;j++){
        if (mino.shap[i][j]){
            //直下ミノ描写
            let value = 0;
            while(field[i+mino.y+value][j+mino.x] == 0) value++;
            ctx.fillStyle = "lightgray";
            ctx.fillRect((j+mino.x)*cellSize, (i+mino.y+value-1)*cellSize, cellSize, cellSize);
            
            //現在地ミノ描写
            ctx.fillStyle = "blue";
            ctx.fillRect((j+mino.x)*cellSize, (i+mino.y)*cellSize, cellSize, cellSize);
        }
    }

    //直下位置描写
}

//minoの動作
const moveMino = async (mino, key) =>{

    //入力情報
    const [leftInput, rightInput, downInput, upInput] = [
        key == "ArrowLeft" || key == "a",
        key == "ArrowRight" || key == "d",
        key == "ArrowDown" || key == "s",
        key == "ArrowUp" || key == "w"
    ]

    //下移動
    for(let i=0;i<(downInput ? mino.shap.length :0);i++)for (let j=0;j<mino.shap[i].length;j++){
        if(field[(i+mino.y+1)][(j+mino.x)] && mino.shap[i][j]){
            enterMino(mino);
            await lineDelete();
            randomMino();
            return true;
        }
    }
    mino.y += downInput ? 1 : 0;

    //左右移動
    const value = leftInput ? -1: rightInput ? 1: 0;

    for(let i=0;i<(leftInput||rightInput?mino.shap.length:0);i++)for (let j=0;j<mino.shap[i].length;j++){
        if(field[(i+mino.y)][(j+mino.x+value)] && mino.shap[i][j]) return;
    }
    mino.x += value;

    //直下移動
    while(upInput){
        if(moveMino(mino, "s")) return;
    }
    drowField();
}

//回転
const rotateMino = (mino, key)=>{
    if (key != " " || key == "e") return;
    let rot = Array.from({length:mino.shap.length},(_,i)=>Array(mino.shap[i].length).fill(0));
    let indent = 0;

    for(let i=0;i<mino.shap.length;i++)for (let j=0;j<mino.shap[i].length;j++){
        rot[j][mino.shap.length -1 - i] = mino.shap[i][j];
        if (field[j+mino.y][(mino.shap.length -1 - i)+mino.x]) return;
    }

    mino.shap = rot;
}

//ランダムミノ生成
let nowMino = {};
const randomMino = ()=>{
    const random = Math.floor(Math.random()*Object.entries(sampleMino).length);
    if(nowMino.mino) delete nowMino.mino;
    nowMino.mino = sampleMino[Object.keys(sampleMino)[random]];

    nowMino.mino.x = Math.floor(Math.random()*(fieldWidth-nowMino.mino.shap.length-1)+1);
    nowMino.mino.y = 0;
    gameOver(nowMino.mino);
}

//列消し
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

lineDelete = async ()=>{
    for(let i=fieldHeight-3;i>=0;i--){
        if(field[i].every(cell => cell === 1)){
            field.splice(i, 1);
            field.unshift(Array(fieldWidth).fill(0));
            field[0][0] = 1; 
            field[0][fieldWidth-1] = 1;
            console.log(i);
            await wait(200);
            drowField();
            i++;
        }
    }
}

//ゲームオーバー
const gameOver = (mino)=>{
    for(let i=0;i<mino.shap.length;i++)for (let j=0;j<mino.shap[i].length;j++){
        if(field[i+mino.y][j+mino.x]){
            fieldClear();
            return;
        }
    }
}


//埋め込み
const enterMino = (mino)=>{
    for(let i=0;i<mino.shap.length;i++)for (let j=0;j<mino.shap[i].length;j++){
        field[i+mino.y][j+mino.x] = mino.shap[i][j] ? 1 : field[i+mino.y][j+mino.x];
    }
}


//リフレッシュ
const timeScale = 1;

const start = ()=>{

    fieldClear();
    randomMino();
    drowField();
}


start();
setInterval(()=>{
    moveMino(nowMino.mino, "s");
}, 1000/timeScale)

// setInterval(()=>{
//     rotateMino(nowMino.mino, " ");
//     moveMino(nowMino.mino, Math.floor(Math.random()-0.5) ? "a" :"d");
//     // moveMino(nowMino.mino, "w");
//     drowField();
// }, timeScale)

//キー入力
document.addEventListener("keydown",(event)=>{
    const key = event.key;
    // console.log(key);
    moveMino(nowMino.mino, key);
    rotateMino(nowMino.mino, key);
    drowField();

    if(key == "o"){
        console.log(field);
    }
})

document.getElementById("left").addEventListener("click",()=>{
    moveMino(nowMino.mino, "a");
    drowField();
})
document.getElementById("down").addEventListener("click",()=>{
    moveMino(nowMino.mino, "s");
    drowField();
})
document.getElementById("right").addEventListener("click",()=>{
    moveMino(nowMino.mino, "d");
    drowField();
})
document.getElementById("rot").addEventListener("click",()=>{
    rotateMino(nowMino.mino, " ");
    drowField();
})