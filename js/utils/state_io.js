import { SubPub } from "./subpub.js";
import { ranking } from "./component_ranking.js";


let State = {};
const Consts = {
  mins_after_incorrect_answer: 7,
  unit_kinds: ["exercise", "video", "assignment", "quiz"],
  story_length_max: 60,
  name_length_max: 25,
  max_n_units_in_section: 8,
  max_n_questions_in_quiz: 10,
};

export default {
  get state() { return State },
  bullet_number_element,
  get_section_units,
  get_chapter_assignments, get_chapter_sections, get_chapter_units,
  get_question_answers, get_quiz_question_status, is_answer_correct,
  get_class_expanded_chapter, set_class_expanded_chapter,
  is_unit_empty,
  Consts,
};

// INIT
(() => {

  const subscriptions = [

    // GETS
    {
      events: "db::get::login::received",
      middleware: (response, params) => {
        State.courses = response.courses;
        State.user = response.user;
      },
    },
    {
      events: "db::get::users::received",
      middleware: (response, params) => {
        State.users = response.users;
        State.roles = response.roles;
        State.courses = response.courses;
      },
    },
    {
      events: "db::get::course::received",
      middleware: (response, params) => {
        State.course = response.course;
        State.chapters = response.chapters;
        State.sections = response.sections;
        State.units = response.units;
        State.dependencies = response.dependencies;
        State.users_units = response.users_units;
        State.quiz_questions = response.quiz_questions;
        State.quiz_options = response.quiz_options;
        State.quiz_answers = response.quiz_answers;
        State.badges = response.badges;
        State.rankings = response.rankings;
      }
    },
    {
      events: ["db::get::date_time::received"],
      middleware: () => { }
    },

    // USERS
    {
      events: ["db::delete::user::received"],
      middleware: (response, params) => {
        cascade_delete("user", response.deleted_user_id);
      }
    },
    {
      events: ["db::post::user::received"],
      middleware: (response, params) => {
        State.users.push(response.user);
      }
    },
    {
      events: ["db::patch::user::received"],
      middleware: (response, params) => {
        const index = State.users.findIndex(u => u.user_id === response.element.user_id);
        State.users.splice(index, 1, response.element);
      }
    },

    // USERS_UNITS
    {
      events: ["db::patch::users_units::received"],
      middleware: (response, params) => {
        const index = State.users_units.findIndex(uu => uu.unit_id === response.users_unit.unit_id);
        State.users_units.splice(index, 1);
        State.users_units.push(response.users_unit);

        calcRanking();
      }
    },

    // QUIZ ANSWERS AND OPTIONS
    {
      events: ["db::post::quiz_answer::received"],
      middleware: (response, params) => {
        State.quiz_answers.push(response.answer);

        if (response.users_unit) {

          const index = State.users_units.findIndex(uu => uu.unit_id === response.users_unit.unit_id);
          if (index !== -1) {
            State.users_units.splice(index, 1);
          }
          State.users_units.push(response.users_unit);

        }
      }
    },
    {
      events: ["db::delete::quiz_option::received"],
      middleware: (response, params) => {
        const index = State.quiz_options.findIndex(qo => qo.quiz_option_id === response.deleted_quiz_option_id);
        State.quiz_options.splice(index, 1);
      }
    },
    {
      events: ["db::post::quiz_option::received"],
      middleware: (response, params) => {
        State.quiz_options.push(response.option);
      }
    },
    {
      events: ["db::patch::quiz_option::received"],
      middleware: (response, params) => {
        response.options.forEach(option => {
          const index = State.quiz_options.findIndex(qo => qo.quiz_option_id === option.quiz_option_id);
          State.quiz_options.splice(index, 1);
          State.quiz_options.push(option);
        });
      }
    },

    // QUIZ_QUESTIONS
    {
      events: ["db::post::quiz_question::received"],
      middleware: (response, params) => {
        State.quiz_questions.push(response.quiz_question);
      }
    },
    {
      events: ["db::patch::quiz_question::received"],
      middleware: (response, params) => {
        response.questions.forEach(question => {
          const index = State.quiz_questions.findIndex(q => q.quiz_question_id === question.quiz_question_id);
          State.quiz_questions.splice(index, 1);
          State.quiz_questions.push(question);
        });
      }
    },
    {
      events: ["db::post::units_quizs_questions::received"],
      middleware: (response, params) => {
        State.quiz_questions = response.quiz_questions;
        State.quiz_options = response.quiz_options;
      }
    },

    // UNITS
    {
      events: ["db::post::unit::received"],
      middleware: (response, params) => {
        if (response.element.kind === "quiz") {
          State.quiz_options.push(response.quiz_option);
          State.quiz_questions.push(response.quiz_question);
        }
        State.units.push(response.element);
      }
    },
    {
      events: ["db::patch::unit::received"],
      middleware: (response, params) => {
        // response contains units in one section
        response.elements.forEach(unit => {
          const index = State.units.findIndex(u => u.unit_id === unit.unit_id);
          State.units.splice(index, 1, unit);
        });
      }
    },
    {
      events: ["db::delete::unit::received"],
      middleware: (response, params) => {

        cascade_delete("unit", response.element.unit_id);

        // spot has been updated. Update section's units
        response.elements.forEach(unit => {
          delete_element("units", unit.unit_id);
          State.units.push(unit);
        });

      }
    },

    // SECTIONS
    {
      events: ["db::post::section::received"],
      middleware: (response, params) => {
        State.sections.push(response.section);
      }
    },
    {
      events: ["db::patch::section::received"],
      middleware: (response, params) => {

        // special case: move section from one chapter to another
        if (params.updated_fields.some(uf => uf.field === "chapter_id")) {
          const index = State.sections.findIndex(s => s.section_id === response.element.section_id);
          State.sections.splice(index, 1, response.element);
        }

        // response contains sections in one chapter (old chapter if section was moved)
        response.elements.forEach(section => {
          const index = State.sections.findIndex(s => s.section_id === section.section_id);
          State.sections.splice(index, 1, section);
        });
      }
    },
    {
      events: ["db::delete::section::received"],
      middleware: (response, params) => {

        cascade_delete("section", response.section_id);

        // spot has been updated. Update chapter's sections
        response.sections.forEach(section => {
          delete_element("sections", section.section_id);
          State.sections.push(section);
        });

      }
    },

    // DEPENDENCIES
    {
      events: ["db::post::dependencies::received"],
      middleware: (response, params) => {
        State.dependencies = response.dependencies;
      }
    },
    {
      events: ["db::delete::dependencies::received"],
      middleware: (response, params) => {
        State.dependencies = response.dependencies;
      }
    },

    // CHAPTERS
    {
      events: ["db::post::chapter::received"],
      middleware: (response, params) => {
        State.chapters.push(response.chapter);
      }
    },
    {
      events: ["db::patch::chapter::received"],
      middleware: (response, params) => {
        State.chapters = response.elements;
      }
    },
    {
      events: ["db::delete::chapter::received"],
      middleware: (response, params) => {
        cascade_delete("chapter", response.chapter_id);

        // spots have been updated
        State.chapters = response.chapters;
      }
    },

    // COURSE
    {
      events: ["db::delete::course::received"],
      middleware: (response, params) => {
        cascade_delete("course", response.course_id);
      }
    },
    {
      events: ["db::patch::course::received"],
      middleware: (response, params) => {
        State.course = response.element;
      }
    },
    {
      events: ["db::post::course::received"],
      middleware: (response, params) => {
        State.courses.push(response.course);
        SubPub.publish({
          event: "db::get::course::request",
          detail: {
            params: {
              course_id: response.course.course_id,
              user_id: State.user.user_id,
            }
          }
        });
      }
    },

    // BADGES & RANK
    {
      events: "db::patch::userBadges::received",
      middleware: (response) => { State.user.badges = response.badges[0].badges }
    },
    {
      events: ["db::get::rankings::received"],
      middleware: (response) => { State.rankings = response.rankings }
    },
    {
      events: ["db::post::ranking::received"],
      middleware: (response) => {
        State.rankings = response.rankings
      }
    },
    {
      events: ["db::patch::points::received"],
      middleware: (response) => {

        let usersPoints = response.rankings.filter(obj => obj.userId == State.user.user_id)[0].points;

        SubPub.publish({
          event: `db::patch::ranking::request`,
          detail: { params: { user_id: State.user.user_id, course: State.course.course_id, points: usersPoints } }
        });

        let userBadges = state_io.state.user.badges;
        userBadges = (userBadges.substring(1, userBadges.length - 1)).split(',');

        switch (State.user.rank) {
          case ("Silver"):
            if (!userBadges.includes(`${state_io.state.course.course_id}.2`)) {
              ranking.patchBadges(`${state_io.state.course.course_id}.2`)
            }
            break;
          case ("Gold"):
            if (!userBadges.includes(`${state_io.state.course.course_id}.3`)) {
              ranking.patchBadges(`${state_io.state.course.course_id}.3`)
            }
            break;
          case ("Diamond"):
            if (!userBadges.includes(`${state_io.state.course.course_id}.4`)) {
              ranking.patchBadges(`${state_io.state.course.course_id}.4`)
            }
            break;
          case ("Platinum"):
            if (!userBadges.includes(`${state_io.state.course.course_id}.5`)) {
              ranking.patchBadges(`${state_io.state.course.course_id}.5`)
            }
            break;
          default:
            break
        }
      }
    },
    {
      events: ["db::patch::ranking::received"],
      middleware: (response) => {

        State.rankings = response.rankings;

        State.user.rank = response.rankings.filter(obj => obj.userId == State.user.user_id)[0].rank;

        SubPub.publish({
          event: "render_user_progress",
          detail: {}

        });

        if (localStorage.getItem("progress") == "RANKINGS") {
          document.getElementById("progress_rankings_btn").click();
        }

      }
    },
    {
      events: ["db::patch::streak::received"],
      middleware: (response, params) => {
        State.user.current_streak = response.current_streak[0].current_streak;
        State.user.high_Streak = response.high_Streak[0].high_Streak;

        if (document.querySelector(".currentStreak")) {
          document.querySelector(".currentStreak").textContent = State.user.current_streak;
        }

        SubPub.publish({
          event: "ranking_done",
          detail: {}
        });

        console.log(localStorage.getItem("progressDiv"));
        console.log(localStorage.getItem("progress"));

        if (localStorage.getItem("progressDiv") == "open" && localStorage.getItem("progress") == "PROGRESS") {
          SubPub.publish({
            event: "render_user_progress"
          });
        }
      }
    },

  ];

  subscriptions.forEach(sb => {

    let { events, middleware } = sb;

    if (!Array.isArray(events)) {
      events = [events];
    }

    events.forEach(event => {

      SubPub.subscribe({
        event,
        listener: ({ response, params }) => {

          response = response?.payload?.data;
          middleware && middleware(response, params);

          fix_ints_and_booleans_state();
          response.element && fix_ints_and_booleans_elements(response.element);
          response.elements && fix_ints_and_booleans_elements(response.elements);
          response.user && fix_ints_and_booleans_elements(response.user);

          const parsed_event = SubPub.parseEvent(event);
          SubPub.publish({
            event: parsed_event.type + "::" + parsed_event.name + "::" + parsed_event.action + "::done",
            detail: { response, params }
          });

        }
      });

    });

  });

  // Can't seem to get int or boolean type as response from sqlite.
  const int_keys = ["spot", "week_start", "week_count", "user_start_year"];
  const boolean_keys = ["can_add_courses", "is_stop_quiz", "check_question", "check_complete", "correct", "done"];
  function fix_ints_and_booleans_state() {
    for (let entity in State) {
      if (Array.isArray(State[entity])) {
        State[entity].forEach(element => {
          fix_ints_and_booleans_in_this_object(element);
        });
      }
      if (entity === "course") {
        fix_ints_and_booleans_in_this_object(State[entity])
      }
    }
  }
  function fix_ints_and_booleans_elements(elements) {
    if (!Array.isArray(elements)) elements = [elements];
    elements.forEach(element => {
      fix_ints_and_booleans_in_this_object(element);
    });
  }
  function fix_ints_and_booleans_in_this_object(object) {
    for (const key in object) {
      int_keys.includes(key) && (object[key] = parseInt(object[key]));
      boolean_keys.includes(key) && (object[key] = !!(object[key] == "1"));
    }
  }

})();


function bullet_number_element(element) {

  let bullet = "";

  if (Consts.unit_kinds.includes(element.kind)) {
    bullet = "." + element.spot;
    element = State.sections.find(s => s.section_id === element.section_id);
  }

  if (element.kind === "section") {
    bullet = "." + element.spot + bullet;
    element = State.chapters.find(c => c.chapter_id === element.chapter_id);
  }

  if (element.kind === "chapter") {
    bullet = element.spot + bullet;
  }

  return bullet;
}

function cascade_delete(entity, id) {

  const entities = ["course", "chapter", "section", "unit", "quiz_question", "quiz_option", "quiz_answer"];
  const index = entities.indexOf(entity);

  if (index !== -1) {

    const next_entity = index >= entities.length - 1 ? false : entities[index + 1];
    delete_element(entity + "s", id);

    if (next_entity) {
      State[next_entity + "s"].filter(x => x[entity + "_id"] === id).forEach(x => cascade_delete(next_entity, x[next_entity + "_id"]));
    }
  }

  if (entity === "unit") {
    State.dependencies && delete_elements(State.dependencies.filter(x => x.unit_id === id), State.dependencies, "unit_id");
    State.users_units && delete_elements(State.users_units.filter(x => x.unit_id === id), State.users_units, "unit_id");
  }

  if (entity === "user") {
    State.users_units && delete_elements(State.users_units.filter(x => x.user_id === id), State.users_units, "user_id");
  }

  if (entity === "section") {
    State.dependencies && delete_elements(State.dependencies.filter(x => x.section_id === id), State.dependencies, "section_id");
  }


}
function delete_elements(to_delete, from_array, key) {
  to_delete.forEach(x => {
    const index = from_array.findIndex(xx => x[key] === xx[key]);
    from_array.splice(index, 1);
  });
}
function delete_element(table, element_id) {
  const kind = table.substring(0, table.length - 1);
  const id_field_name = kind + "_id";
  const index = State[table].findIndex(x => x[id_field_name] === element_id);
  if (index !== -1) {
    State[table].splice(index, 1);
  } else {
    console.log("Couldn't delete element", table, kind, id_field_name, element_id);
  }
}
function delete_sections_units(section_id) {

  for (let i = State.units.length - 1; i >= 0; i--) {
    const unit = State.units[i];
    if (unit.section_id === section_id) {

      delete_users_units(unit.unit_id);
      delete_element("units", unit.unit_id);

    }
  }
}
function delete_chapters_sections(chapter_id) {

  for (let i = State.sections.length - 1; i >= 0; i--) {
    const section = State.sections[i];
    if (section.chapter_id === chapter_id) {

      delete_sections_units(section.section_id);
      delete_element("sections", section.section_id);

    }
  }
}
function delete_users_units(id, by_user = false) {

  let index;
  if (by_user) {

    index = State.users_units.findIndex(uu => uu.user_id == id);

  } else {

    index = State.users_units.findIndex(uu => uu.unit_id == id);

  }

  if (index !== -1) State.users_units.splice(index, 1);
  // else console.log("Unavailable users_units. ID: " + id + ". By user: " + (by_user ? "yes" : "no"));

}

function is_unit_empty(element) {

  return element.kind !== "quiz" && !element.story ||
    element.kind === "quiz" && element.name !== "Done";
}

function get_class_expanded_chapter(element) {

  const expanded_chapters = JSON.parse(localStorage.getItem("expanded_chapters"));
  return !!expanded_chapters?.find(c => c.chapter_id === element.chapter_id && c.course_id === element.course_id);

}
function set_class_expanded_chapter(element, expanded) {

  const expanded_chapters = JSON.parse(localStorage.getItem("expanded_chapters")) || [];
  if (expanded) {
    expanded_chapters.push(element);
  } else {
    const index = expanded_chapters.find(c => c.chapter_id === element.chapter_id && c.course_id === element.course_id);
    if (index !== -1) {
      expanded_chapters.splice(index, 1);
    }
  }

  localStorage.setItem("expanded_chapters", JSON.stringify(expanded_chapters));

}

function get_chapter_sections(chapter_id) {
  return State.sections.filter(c => c.chapter_id === chapter_id).sort((a, b) => a.spot > b.spot);
}
function get_section_units(section_id) {
  return State.units.filter(c => c.section_id === section_id).sort((a, b) => a.spot > b.spot);
}
function get_chapter_units(chapter_id) {
  let units = [];
  get_chapter_sections(chapter_id).forEach(s => units = [...units, ...get_section_units(s.section_id)]);
  return units;
}
function get_chapter_assignments(chapter_id) {
  return get_chapter_units(chapter_id).filter(u => u.kind === "assignment");
}

function get_quiz_question_status(question) {

  let status = "answered_no";
  const answers = get_question_answers({ question });
  if (answers.length) {
    status = answers.some(answer => is_answer_correct({ answer })) ? "answered_correct" : "answered_incorrect";
  }
  return status;

}
function get_question_answers({ question }) {
  return State.quiz_answers.filter(a => a.quiz_question_id === question.quiz_question_id);
}
function is_answer_correct({ answer }) {
  const option = State.quiz_options.find((op => op.quiz_option_id === answer.quiz_option_id));
  return option.correct;
}

function calcRanking() {
  let highStreak = State.user.high_Streak;

  let allChapters = State.chapters;
  let allSections = State.sections;
  let allUnits = State.units;
  let users_units = State.users_units;

  let chaptersCompleted = [];
  let sectionsCompleted = [];

  //Loops to check sections completed
  allSections.forEach(section => {
    let sectionsUnits = allUnits.filter(unit => unit.section_id == section.section_id);
    let sectionsUnitsCompleted = users_units.filter(un => un.section_id == section.section_id && un.check_complete == true);

    if (sectionsUnits.length == sectionsUnitsCompleted.length) {
      sectionsCompleted.push(section);
    }

  });

  allChapters.forEach(chapter => {

    let chaptersSections = allSections.filter(section => section.chapter_id == chapter.chapter_id);
    let chaptersSectionsCompleted = [];

    chaptersSections.forEach(section => {
      if (sectionsCompleted.includes(section)) {
        chaptersSectionsCompleted.push(section);
      }
    });

    if (chaptersSections.length == chaptersSectionsCompleted.length) {
      chaptersCompleted.push(chapter);
    }
  });

  let points = sectionsCompleted.length;

  chaptersCompleted.forEach(chapter => {
    points += chapter.spot;
  });

  sectionsCompleted.forEach(sect => {
    points++;
  });

  if (highStreak != null) {
    points += parseInt(highStreak);
  }

  SubPub.publish({
    event: "db::patch::points::request",
    detail: { params: { user_id: State.user.user_id, course: State.course.course_id, points: points } }
  })

}
