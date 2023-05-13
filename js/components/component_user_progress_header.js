import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

export default {};

; (() => {
    SubPub.subscribe({
        event: "db::get::course::done",
        listener: render
    });
})();


function render() {
    let progressHeader = document.getElementById("progress_header")

    // Display ranking header (otherwise hidden until course has been chosen)
    progressHeader.style.display = "";

    progressHeader.innerHTML = `
    <div id="progress_header_rank_img"></div>
    <div id="progress_header_info">
        <div id="progress_header_currentstreak">Current streak: 3</div>
        <div id="progress_header_recentbadge">
            <p>Recent badge:</p>
            <div></div>
        </div>
    </div>
    `

}


/*

    let { bestStreak, badge, divison } = state_io.state.user; 

    containerDiv 
        divisonDiv
            bildDivison
        divInfo
            innehåller treNycklarna
            bild på badge 
            pCurrentStreak
            divProgressBar
     
    containerDiv append to content_course_open div i index.php

    containerDiv lister click 
        publicera
            event: “render_user_progress”

            
*/