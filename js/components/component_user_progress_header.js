import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";

export default {};

; (() => {
    // When course is done, request badges. 
    // Passar inte att hämta badges här, vet ej var annars dock?
    SubPub.subscribe({
        event: "db::get::course::done",
        listener: () => {
            SubPub.publish({
                event: "db::get::badges::request",
                detail: {}
            });
        }
    });
    // When badges are done, render progress header
    SubPub.subscribe({
        event: "db::get::badges::done",
        listener: render
    });

    // When current/high streak are updated
    SubPub.subscribe({
        event: " db::patch::streak::done",
        listener: render
    });

})();

function render() {
    const progressHeader = document.getElementById("progress_header")

    // Display ranking header (otherwise hidden until course has been chosen)
    progressHeader.style.display = "";
    progressHeader.innerHTML = `
    <div id="progress_header_rank_img"></div>
    <div id="progress_header_info">
        <div id="progress_header_currentstreak"></div>
        <div id="progress_header_recentbadge">
            <p>Recent badge:</p>
            <div></div>
        </div>
    </div>
    `;

    fillProgressHeader()

    // On progress header click, publish event
    progressHeader.addEventListener('click', () => {
        SubPub.publish({
            event: "render_user_progress"
        });
    })
}

function fillProgressHeader() {
    // High streak
    document.getElementById("progress_header_currentstreak").innerHTML = `Current streak: ${state_io.state.user.high_Streak}`

    // If no badges yet
    if (state_io.state.user.badges == "[]") {
        document.querySelector("#progress_header_recentbadge p").innerHTML = "No badges yet...";
        document.querySelector("#progress_header_recentbadge div").style.backgroundImage = "none";
    }

    // If at least one badge
    else {
        let userBadges = (state_io.state.user.badges.substring(1, state_io.state.user.badges.length - 1)).split(',').reverse();
        let recentBadge = userBadges.find(b => b.split('.')[0] == state_io.state.course.course_id).replace('.', '');
        //let badgeImg = (state_io.state.badges.find(badge => badge.badge_id == recentBadge)).img;
        let badgeImg = "badge";

        document.querySelector("#progress_header_recentbadge p").innerHTML = "Recent badge: ";
        document.querySelector("#progress_header_recentbadge div").style.backgroundImage = "url(" + `https://cdn-icons-png.flaticon.com/512/3135/3135783.png` + ")";
        document.querySelector("#progress_header_recentbadge div").style.backgroundImage = "url(" + `media/badges/${badgeImg}.png` + ")";
    }

    // Rank
    /*
        TO DO!
        Add code for displaying correct rank img when calculation function is finished
        + remove temporary image from CSS (component_user_progress_header.css)
    */
}