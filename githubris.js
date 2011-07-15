(function (window, undefined) {
    var githubris = function () {
        var createChart = function (data, query) {
            var bars;
            var chart = document.createElement('article');
            var charts = document.getElementById('charts');
            var counts = [];
            var heading = document.createElement('h3');
            var vis;
            var h = 200;
            var w = 200;
            var x;
            var y;

            heading.textContent = query;
            chart.className = 'chart';
            chart.appendChild(heading);
            charts.insertBefore(chart, charts.firstChild);

            for(var count in data) {
                if(data.hasOwnProperty(count)) {
                    counts.push(data[count].count);
                }
            }

            x = d3.scale.linear().domain([0, d3.max(counts)]).range([0, w]),
            y = d3.scale.ordinal().domain(d3.range(data.length)).rangeBands([0, h], .4);

            vis = d3.select(chart)
              .append("svg:svg")
                .attr("width", w + 200)
                .attr("height", h)
              .append("svg:g")
                .attr("transform", "translate(100,0)");

            bars = vis.selectAll("g.bar")
                .data(data)
              .enter().append("svg:g")
                .attr('x', function (d) { return x(d.count); })
                .attr("class", "bar")
                .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

            bars.append("svg:rect")
                .attr("fill", "steelblue")
                .attr("width", function (d) { return x(d.count); })
                .attr("height", y.rangeBand());

            bars.append("svg:text")
                .attr("x", function (d) { return x(d.count); })
                .attr("y", y.rangeBand() / 2)
                .attr("dx", 6)
                .attr("dy", ".35em")
                .attr("fill", "black")
                .attr("text-anchor", "start")
                .text(function (d) { return d3.format(',')(d.count); });

            bars.append("svg:text")
                .attr("x", 0)
                .attr("y", y.rangeBand() / 2)
                .attr("dx", -6)
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .text(function(d, i) { return d.language });
        };

        return {
            search: function (query) {
                var encodedQuery = encodeURI(query);
                var message = document.getElementById('message');
                var queryInput = document.getElementById('query');
                var xhr = new XMLHttpRequest();

                xhr.open('GET', '/search/' + query, true);

                xhr.onreadystatechange = function (event) {
                    var results;

                    if (xhr.readyState === 4) {
                        if(xhr.status === 200) {
                            results = JSON.parse(xhr.responseText);
                            if(results.length === 0) {
                                message.innerHTML = 'Sorry, no code matches found.';
                            } else {
                                createChart(results, query);
                                message.innerHTML = '';
                            }
                        } else {
                            message.innerHTML = 'Yuck, server barf!';
                        }
                        queryInput.disabled = false;
                        queryInput.select();
                        queryInput.className = '';
                    }
                };

                xhr.send(null);

                queryInput.disabled = true;
                queryInput.className = 'loading';
                message.innerHTML = '';
            }
        };
    };

    window.githubris = new githubris();
})(window);

function init() {
    var queryInput = document.getElementById('query');
    var searchLink = document.getElementById('search');
    var clearLink = document.getElementById('clear');

    githubris.search(queryInput.value);

    queryInput.onkeyup = function (event) {
        if(event.keyCode === 13 && queryInput.disabled === false) {
            githubris.search(queryInput.value);
        }
    }

    searchLink.onclick = function () {
        if(queryInput.disabled === false) {
            githubris.search(queryInput.value);
        }
    }

    clearLink.onclick = function () {
        var charts = document.getElementById('charts');
        while(charts.firstChild) {
            charts.removeChild(charts.firstChild);
        }
    }
};
