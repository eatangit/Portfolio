import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const projectsTitle = document.querySelector('.projects-title');

if(projectsTitle) {
    projectsTitle.textContent = `${projects.length} Projects`;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedYear = null;
let query = '';

function filterBySearch(projectsList) {
    return projectsList.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

function updatePage() {
    // apply the search filter first
    let searchedProjects = filterBySearch(projects);

    // then apply the year filter on top of the search results
    let visibleProjects = selectedYear === null
        ? searchedProjects
        : searchedProjects.filter((p) => p.year === selectedYear);

    renderProjects(visibleProjects, projectsContainer, 'h2');
    renderPieChart(searchedProjects);
}

function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));

    let svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').remove();

    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    arcs.forEach((arc, idx) => {
        let year = data[idx].label;
        svg
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .attr('class', year === selectedYear ? 'selected' : '')
            .on('click', () => {
                selectedYear = selectedYear === year ? null : year;
                updatePage();
            });
    });

    data.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

updatePage();

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    updatePage();
});
