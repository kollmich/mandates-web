
const parseYear = d3.timeParse("%Y-%m-%d");

function cleanMandates(data) {
	return data.map(d => ({
        ...d,
        poll_date: parseYear(d.poll_date),
        result: +d.result,
        mov_avg: +d.mov_avg
	}));
}

function cleanPoliticians(data) {
	return data.map(d => ({
        ...d,
        poll_date: parseYear(d.poll_date),
        approval: +d.approval,
        disapproval: +d.disapproval,
        difference: +d.approval - +d.disapproval
	}));
}

export default {
    cleanMandates,
    cleanPoliticians
};
  