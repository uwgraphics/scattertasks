/// <reference path="../typings/tsd.d.ts" />
/// <reference path="taskrank.ts" />
/// <reference path="exampleVis.ts" />

$(document).ready(() => {
    
    var tableData = new Scattertasks.TableController(d3.select("#task_rationale > tbody"));
    $.getJSON("utils/getAttribsTasks.php", tableData.createInterface);
    
    $("#attrib1, #attrib2").on('change', function() {
        var thisDropdown = d3.select(this);
        var thisId = thisDropdown.attr('id');
        var valueId = "#attrib_val" + thisId.charAt(thisId.length - 1);
        
        var selectedAttribId = +thisDropdown.property('value');
        var subOptions = d3.select(valueId).selectAll('option')
            .data(tableData.attrib_values.filter(d => d.attribute_id == selectedAttribId), d => d.attrib_value_id.toString());
            
        subOptions.exit().remove();
        subOptions.enter().append('option')
            .attr('value', d => d.attrib_value_id)
            .text(d => d.attrib_value_name);
            
        // have to coax the number to boolean, this isn't just bad style :)
        subOptions.filter(d => d.is_default_attrib_val == true).attr('selected', 'selected');
        
        // disable those options in attrib2 that are <= attrib1 (and similarly for attrib1 >= attrib2)
        $("#attrib1 option, #attrib2 option").removeProp('disabled');
        d3.selectAll("#attrib2 option").filter(d => d.attribute_id == d3.select("#attrib1").property('value'))
            .attr('disabled', 'disabled');
        d3.selectAll("#attrib1 option").filter(d => d.attribute_id == d3.select("#attrib2").property('value'))
            .attr('disabled', 'disabled');
        
        if (!tableData.firstTime) $('#attrib_val1').trigger('change');
        tableData.firstTime = false;
    });
    
    $("#attrib_val1, #attrib_val2").on('change', function() {
        tableData.av1 = d3.select("#attrib_val1").property('value');
        tableData.av2 = d3.select("#attrib_val2").property('value');
        
        // make sure av1 is always smaller (for DB access) swap if so
        if (tableData.av1 > tableData.av2) {
            var tmp;
            tmp = tableData.av1;
            tableData.av1 = tableData.av2;
            tableData.av2 = tmp;
        }
        
        if (tableData.av1 != tableData.av2) {
            $("#av1").html($("#attrib_val1 option:selected").text());
            $("#a1").html($("#attrib1 option:selected").text());
            $("#av2").html($("#attrib_val2 option:selected").text());
            $("#a2").html($("#attrib2 option:selected").text());
            
            $.getJSON("utils/getTaskRationale.php", {"av1": tableData.av1, "av2": tableData.av2}, tableData.populateReasons);
        }
    });
});
