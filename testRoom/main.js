class AkiDinoGame{
    constructor(){

        this.canvas = document.getElementById("myCanvas");
        this.ctx    = this.canvas.getContext("2d");

        this.canvas.width  = 300;
        this.canvas.height = 400;

        this.draw(0, 100);
        this.draw(0, 200);
        this.draw_2();

        //変数
        this.turn = false;
    }

    bindUI(){

    }

    draw(i, j){
        if(i == this.canvas.width -20|| i == 0) this.turn = !this.turn;

        this.ctx.clearRect(i-(this.turn ? -1 : 1),j,20,20);
        
        this.ctx.fillStyle = "gray";
        this.ctx.fillRect(i,j,20,20);

        setTimeout(() => {
            this.draw(i+ (this.turn ? -1 : 1), j);
        }, 10);
    }

    draw_2(){

    }
}

window.addEventListener("DOMContentLoaded", ()=> new AkiDinoGame());
