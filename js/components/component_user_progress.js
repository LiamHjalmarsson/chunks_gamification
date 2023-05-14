import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

export default {};

; (() => {
    SubPub.subscribe({
        event: "render_user_progress",
        listener: render
    });
})();

function render() {
    const progressDiv = document.getElementById("content_user_progress");
    progressDiv.style.padding = '15px'
    progressDiv.style.height = '15vw';

    progressDiv.innerHTML = `
    <button id="progress_close">CLOSE</button>
    <div id="progress_container">
        <div id="progress_rank">
            <div id="progress_rank_img"></div>
            <div id="progress_rank_progressbar">
            <div><span>Next rank: Diamond</span></div>
            </div>
            <div id="progress_stats">
                <div>Current streak: 3</div>
                <div>Best streak: 5</div>
            </div>
        </div>
        <div id="progress_badges">
            
        </div>
    </div>
    `


    document.getElementById("progress_close").addEventListener('click', () => {
        progressDiv.style.padding = '0'
        progressDiv.style.height = '0';
        progressDiv.innerHTML = "";
    })
}


/*
function render () {
    töm div i content_course_open div i index.php
    containerDiv 
        button close
            button lister click
                töm div i content_course_open div i index.php
         divisonContainer
            divBadge
                imageBadge
            divProgressBar
                progessBar
            divStreaks
                currentSteak
                bestStreak
        badgesContainer 
            loop badges
                badgeDiv
                    imageBadge 
                    ( imageBade hover text info ) 
        buttonRanking
            buttonRanking listner click 
                publish 
                    event: “render_ranking.”
}
*/