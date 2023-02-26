/**
 * Copyright (c) 2022
 *
 * This file generates the schedule for a student based on the general Course Schedule (https://alunos.uminho.pt/PT/estudantes/Paginas/InfoUteisHorarios.aspx)
 * and the student's shifts (https://swap.di.uminho.pt/).
 *
 * Example of usage:
 * ```
 * function subAbbr(sub, turn) {
 *   const abbrs = {
 *     "Análise Matemática para Engenharia": "AME",
 *     "Elementos de Probabilidades e Teoria de Números": "EPTN",
 *     "Laboratórios de Informática II": "LI II",
 *     "Lógica": "L",
 *     "Programação Imperativa": "PI",
 *     "Sistemas de Computação": "SC"
 *   }
 *
 *   if (sub.includes("Laboratórios")) return abbrs[sub];
 *   if (turn.includes("TP") || turn.includes("PL")) return abbrs[sub];
 *   return `${abbrs[sub]} (T)`
 * }
 * 
 * const filter = {
 *   "Análise Matemática para Engenharia": ["TP6", "T1"],
 *   "Elementos de Probabilidades e Teoria de Números": ["TP2", "T1"],
 *   "Laboratórios de Informática II": ["PL7"],
 *   "Lógica": ["TP3", "T1"],
 *   "Programação Imperativa": ["TP8", "T1"],
 *   "Sistemas de Computação": ["PL8", "T1"]
 * }
 * 
 * const schedule = grabSchedule()
 * const formSched = formatSchedule(schedule, filter, subAbbr)
 * console.log(formSched)
 * ```
 *
 *
 * @summary UMinho Course Schedule grabber and formatter.
 * @author Rafael Fernandes <rafaelsantosfernandes660@gmail.com>
 *
 * Created at     : 2022-02-10 14:41:14 
 * Last modified  : 2022-02-10 14:41:14 
 */

/**
 * Generates a Schedule by grabbing the Course Schedule and formatting it using your turns.
 * 
 * Requires a formatter (like {@link formatSchedule}) for translation into a readable format.
 *
 * @return {InternalSchedule} 
 */
function grabSchedule() {
	const scheduleTable = getChildOrThrow(
		document,
		"div.rsContent.rsWeekView > table",
		(e) => !(e.length > 1 || e === 0),
		"Unable to grab schedule: Could not find schedule table."
	)[0];

	const tbody = getChildOrThrow(
		scheduleTable,
		"tbody > tr > td.rsContentWrapper > div.rsContentScrollArea > table.rsContentTable > tbody",
		(e) => !(e.length > 1 || e === 0),
		"Unable to grab schedule: Could not find schedule table contents."
	)[0];

	const rows = getChildOrThrow(
		tbody,
		"tr:not(.rsAlt)",
		(e) => !(e === 0),
		"Unable to grab schedule: Could not find schedule table content rows."
	);

	/** @type {InternalSchedule} */
	const entries = {
		0: {},
		1: {},
		2: {},
		3: {},
		4: {}
	};
	for (let i = 0; i < rows.length; i++) {
		const hourEntries = iterateTableRow(rows[i]);

		for (let j = 0; j < hourEntries.length; j++) {
			entries[j][i] = hourEntries[j];
		}
	}
  
	return entries;
}

/**
 * Formats an {@link InternalSchedule}.
 *
 * @param {InternalSchedule} schedule
 * @param {Object.<string,string[]>} filter
 * @param {function(string, string): string} abbr
 * @returns {string}
 */
function formatSchedule(schedule, filter, abbr) {
	const days = ["Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira"]
	const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"]

	let formattedEntries = "";
	for (const [dayKey, day] of Object.entries(schedule)) {
		const formattedDayHours = [];

		formattedEntries += `${days[dayKey]}\n`;

		for (const [hourKey, hour] of Object.entries(day)) {
			const Class = hour.filter(e => {
				return (filter[e.subject].includes(e.turn));
			})[0]
	
			if (Class) formattedDayHours.push(`- ${hours[hourKey]} - ${hours[parseInt(hourKey) + Class.time] ?? "xx:xx"} | ${abbr(Class.subject, Class.turn)} | ${Class.room}`);
		}

		if (formattedDayHours.length > 0) formattedEntries += "  " + formattedDayHours.join("\n  ");
		else formattedEntries += "  - Sem aulas";

		formattedEntries += "\n";
	}

	return formattedEntries;
}

/**
 * @param {string} sel 
 * @param {(e: NodeListOf<Element>) => boolean} cond
 * @param {string} err
 * @return {NodeListOf<Element>} 
 */
function getChildOrThrow(elem = document, sel, cond, err) {
	const elems = elem.querySelectorAll(sel);
	if (!cond(elems)) throw new Error(err);

	return elems;
}

/**
 * @param {Element} row
 * @returns { ScheduleEntry[][] }
 */
function iterateTableRow(row) {
	const children = Array.from(row.children)

	/** @type { ScheduleEntry[][] } */
	const entries = []

	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (child.innerHTML === "&nbsp;") {
			entries.push([]);
			continue;
		}

		const data = Array.from(child.querySelectorAll("div.rsWrap > div"));
		if (data.length === 0) continue;

		/** @type {ScheduleEntry[]} */
		const dayEntries = data.map(e => {
			const parts = e.getAttribute("title").split("\n");

			return {
				subject: parts[0].trim(),
				room: parts[1].trim(),
				turn: parts[2].trim(),
				time: (e.style.height === "116px") ? 1 : 2
			}
		})

		entries.push(dayEntries);
	}

	return entries;
}

/**
 * @typedef {Object} ScheduleEntry
 * @property {string} subject
 * @property {string} room
 * @property {string} turn
 * @property {number} time
 */

/**
 * @typedef {Object} InternalSchedule
 * @property {InternalScheduleEntry} 0
 * @property {InternalScheduleEntry} 1
 * @property {InternalScheduleEntry} 2
 * @property {InternalScheduleEntry} 3
 * @property {InternalScheduleEntry} 4
 */

/**
 * @typedef {Object.<string, ScheduleEntry[]>} InternalScheduleEntry
 */

/**
 * @typedef {Object} Schedule
 * @property {string} Segunda-Feira
 * @property {string} Terça-Feira
 * @property {string} Quarta-Feira
 * @property {string} Quinta-Feira
 * @property {string} Sexta-Feira
 */
