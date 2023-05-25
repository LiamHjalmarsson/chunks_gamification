import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";
import { ranking } from "../utils/component_ranking.js";

export default {};

; (() => {
    SubPub.subscribe({
        event: "render_user_progress",
        listener: render
    });
})();

function render() {
    const progressDiv = document.getElementById("content_user_progress");
    progressDiv.style.padding = '15px';

    progressDiv.style.height = '15vw';

    progressDiv.style.height = '20vw';

    progressDiv.style.opacity = '1';
    progressDiv.innerHTML = `
        <button id="progress_close_btn">CLOSE</button>
        <div id="progress_container">
            <div id="progress_rank">
                <div id="progress_rank_current"></div>
                    <div id="progress_rank_img"></div>
                    <div id="progress_rank_progressbar">
                    <div><span></span></div>
                    </div>
                    <div id="progress_stats">
                        <div>Current streak: 3</div>
                        <div>Best streak: 5</div>
                    </div>
            </div>
            <div id="progress_badges_container">
                <div>Badges</div>
                <div id="progress_badges">            
                </div>
            </div>
        </div>
        <button id="progress_rankings_btn">RANKINGS</button>
    `

    fillProgressRanking()

    // On close click: close and empty main container


    // On close click

    document.getElementById("progress_close_btn").addEventListener('click', () => {
        progressDiv.style.padding = '0'
        progressDiv.style.height = '0';
        progressDiv.style.opacity = '0';
    })

}

function fillProgressRanking() {


    // On ranking click
    document.getElementById("progress_rankings_btn").addEventListener('click', () => {
        SubPub.publish({
            event: "render_ranking"
        });
    })

    renderProgressRanking()
    renderBadges()
}

// RENDER ALL BADGES
function renderBadges() {
    let userBadges = state_io.state.user.badges;

    // If no badges yet
    if (userBadges == "[]") {
        document.getElementById("progress_badges").innerHTML = "<div>Inga badges ännu!</div>"
    }

    // If at least one badge
    else {
        // Remove first and last character [] and split on ,
        userBadges = (userBadges.substring(1, userBadges.length - 1)).split(',');

        // Checking if the badge belongs to the current course
        userBadges.forEach(badge => {
            if (badge.split('.')[0] == state_io.state.course.course_id)
                renderBadge(badge.replace('.', ''))
        });
    }
}

// RENDER A SINGLE BADGE
function renderBadge(b) {
    let badgeContainer = document.getElementById("progress_badges");
    let badgeDiv = document.createElement('div');
    let badgeInfo = (state_io.state.badges.find(badge => badge.badge_id == b))
    badgeDiv.innerHTML = `<div class="badge_popup">${badgeInfo.description}</div>`
    badgeDiv.classList.add("progress_badge")
    badgeDiv.style.backgroundImage = `url(media/badges/${badgeInfo.img}.png)`
    badgeContainer.appendChild(badgeDiv)

    // Badge hover
    document.querySelectorAll(".progress_badge").forEach(element => {
        element.addEventListener('mouseover', (e) => { badgeHover(e.target) })
    })
}

// HOVER ON BADGE
function badgeHover(badge) {
    //badge.firstElementChild.style.height = "6vw";
    //badge.firstElementChild.style.width = "7vw";
    badge.firstElementChild.style.opacity = "1";
    // badge.firstElementChild.style.display = "block";

    badge.addEventListener('mouseout', () => {
        // badge.firstElementChild.style.display = "none";
        //badge.firstElementChild.style.height = "0";
        //badge.firstElementChild.style.width = "0";
        badge.firstElementChild.style.opacity = "0";
    })
}

// RENDER PROGRESS OF RANKING
function renderProgressRanking() {
    // Current rank (img + text)
    let rank = ranking.calculateRank()
    document.getElementById("progress_rank_img").style.backgroundImage = `url(../media/${rank.toLowerCase()}.png)`
    document.getElementById("progress_rank_current").innerHTML = `Current rank: ${rank}`

    // Next rank (progress + text)
    document.querySelector("#progress_rank_progressbar > div > span").innerHTML = `Next rank: ${ranking.calculateNextRank().nextRank}`;
    document.querySelector("#progress_rank_progressbar > div").style.width = `${ranking.calculateNextRank().percentageDone}%`;

    // Highest streak
    document.querySelector("#progress_stats > div:last-child").innerHTML = `Highest streak: ${state_io.state.user.high_Streak}`;
}

// Add new badge to user
// newBadge param to be formatted: course.badgenr
// Example for course 2 with badge number 13  =  2.13
// This will correlate with the badge in the database with the id 213
function patchBadges(newBadge) {
    let userBadges = state_io.state.user.badges;
    userBadges = userBadges.slice(0, -1).replace(" ", "");
    userBadges = userBadges + "," + newBadge + "]";
    console.log(userBadges)

    SubPub.publish({
        event: `db::patch::badges::request`,
        detail: { params: { user_id: state_io.state.user.user_id, badges: userBadges } }
    });
}

/*
TO DO
- Transitions (not just height but everything in the container really)
- Height on... everything?!?!
    - Mostly to ensure that the height adjusts to fit all badges, but still work with transitions
- Hover on badges to get descripton
- Load correct badges from DB
- Calculate and display correct rank + image + progress bar (these are just placeholders for now)
- Clean up the code, waaay to many IDs and messy CSS?? 
- What to display if youre at the top rank + how should the progress bar look then?
- Add current streak (new key in DB?)

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