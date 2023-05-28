import state_io from "../utils/state_io.js";
import { SubPub } from "../utils/subpub.js";
import { ranking } from "../utils/component_ranking.js";

export default {};

; (() => {
    // On header click
    SubPub.subscribe({
        event: "render_user_progress",
        listener: render
    });
})();

function render() {
    const progressDiv = document.getElementById("content_user_progress");
    progressDiv.innerHTML = "";
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
                        <div></div>
                        <div></div>
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
    // On close click
    document.getElementById("progress_close_btn").addEventListener('click', () => {
        progressDiv.style.padding = '0'
        progressDiv.style.height = '0';
        progressDiv.style.opacity = '0';
    })
    fillProgressRanking()
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
    userBadges = userBadges.substring(1, userBadges.length - 1);
    userBadges = userBadges.split(',')
    let courseBadges = userBadges.filter(b => b.split('.')[0] == state_io.state.course.course_id);

    // If no badges yet
    if (userBadges == [] || courseBadges == "") {
        document.getElementById("progress_badges").innerHTML = "<div>Inga badges ännu!</div>"
    }
    // If at least one badge
    else {

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
    document.getElementById("progress_rank_img").style.backgroundImage = `url(../media/${state_io.state.user.rank.toLowerCase()}.png)`;
    document.getElementById("progress_rank_current").innerHTML = `Current rank: ${state_io.state.user.rank}`;

    // Next rank (progress + text)
    document.querySelector("#progress_rank_progressbar > div > span").innerHTML = `Next rank: ${ranking.calculateNextRank().nextRank}`;
    document.querySelector("#progress_rank_progressbar > div").style.width = `${ranking.calculateNextRank().percentageDone}%`;

    // Current streak
    if (!state_io.state.user.current_streak) {
        document.querySelector("#progress_stats > div:first-child").innerHTML = `Current streak: No streak yet...`;
    } else {
        document.querySelector("#progress_stats > div:first-child").innerHTML = `Current streak: ${state_io.state.user.current_streak}`;
    }

    // Highest streak
    if (!state_io.state.user.high_Streak) {
        document.querySelector("#progress_stats > div:last-child").innerHTML = `Highest streak: No streak yet...`;
    } else {
        document.querySelector("#progress_stats > div:last-child").innerHTML = `Highest streak: ${state_io.state.user.high_Streak}`;
    }
}