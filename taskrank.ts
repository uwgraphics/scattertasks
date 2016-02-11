class Startup {
    public static main(): number {
        console.log('Hello World');
        return 0;
    }
}

interface AbstractTasks {
    task_id: number;
    task_name: string;
    description?: string;
}

interface DataAttribute {
    attribute_id: number;
    attrib_value_id: number;
    attribute_name: string;
    attrib_value_name: string;
    is_default_attrib_val: boolean;
    description?: string;
}

interface Rankings {
    ranking_id: number;
    ranking_name: string;
    value: number;
    description: string;
}

interface PreData {
    tasks: AbstractTasks[];
    default_attribs: DataAttribute[];
    attrib_values: DataAttribute[];
    rankings: Rankings[];
}

interface RationaleEntry {
    rationale_id: number;
    attrib_value1: number;
    attrib_value2: number;
    task_id: number;
    ranking_text: string;
    rationale: string;
    strategies?: string;
}

interface Rationale {
    rationale_id: number;
    task_id: number;
    ranking_name: string;
    rationale: string;
    strategies?: string;
    task_name: string;
}

var tasks: AbstractTasks[];
var default_attribs: DataAttribute[];
var attrib_values: DataAttribute[];
var rankings: Rankings[];

var createInterface = (data: PreData) => {
    tasks = data.tasks;
    default_attribs = data.default_attribs;
    attrib_values = data.attrib_values;
    rankings = data.rankings;
    
    d3.selectAll("#attrib1, #attrib2").selectAll('option')
        .data(attrib_values, d => d.attribute_id.toString()).enter()
        .append('option')
            .attr('value', d => d.attribute_id)
            .text(d => d.attribute_name);
    
    d3.select("#attrib2 > option:nth-child(2)").attr('selected', 'selected');
    $("#attrib1, #attrib2").trigger('change');
};

var firstTime = true;
$("#attrib1, #attrib2").on('change', function() {
    var thisDropdown = d3.select(this);
    var thisId = thisDropdown.attr('id');
    var valueId = "#attrib_val" + thisId.charAt(thisId.length - 1);
    
    var selectedAttribId = +thisDropdown.property('value');
    var subOptions = d3.select(valueId).selectAll('option')
        .data(attrib_values.filter(d => d.attribute_id == selectedAttribId), d => d.attrib_value_id.toString());
        
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
    
    if (!firstTime) $('#attrib_val1').trigger('change');
    firstTime = false;
});

var av1, av2;
$("#attrib_val1, #attrib_val2").on('change', function() {
    
    av1 = d3.select("#attrib_val1").property('value');
    av2 = d3.select("#attrib_val2").property('value');
    
    // make sure av1 is always smaller (for DB access) swap if so
    if (av1 > av2) {
        var tmp;
        tmp = av1;
        av1 = av2;
        av2 = tmp;
    }
    
    if (av1 != av2) {
        $("#av1").html($("#attrib_val1 option:selected").text());
        $("#a1").html($("#attrib1 option:selected").text());
        $("#av2").html($("#attrib_val2 option:selected").text());
        $("#a2").html($("#attrib2 option:selected").text());
        
        $.getJSON("utils/getTaskRationale.php", {"av1": av1, "av2": av2}, populateReasons);
    }
});

var populateReasons = function(data: Rationale[]) {
    var tasksFromDB = data.map(d => d.task_id);
    var noBlanksData = tasks.map(t => { 
        if (tasksFromDB.indexOf(t.task_id) != -1) {
            return data.filter(d => d.task_id == t.task_id)[0];
        } else {
            return <Rationale>{
                rationale_id: 0, 
                task_id: t.task_id, 
                task_name: t.task_name,
                ranking_name: "??", 
                rationale: "??", 
                strategies: "??"
            };
        }
    });
    
    populateReasonsTR(noBlanksData);
    d3.selectAll('td.editable').on('click', editField);
};

var populateReasonsTR = function(data: Rationale[]) {
    // we expect to have all 12 tasks, so just remove everything from the table
    d3.selectAll('tr.reason').remove();
    
    // set up the default stuff (if no data for this data parameter pair and task exists in DB
    var reasons = d3.select("#task_rationale > tbody").selectAll('tr.reason').data(data, d => d.task_id.toString());
    var newReasons = reasons.enter()
        .append('tr')
        .attr('class', d => {
            switch (d.ranking_name) {
                case "Need support":
                case "Nonsensical":
                case "Impossible":
                    return 'reason danger';
                case "Doable":
                    return 'reason warning';
                case "Yes":
                    return 'reason success';
                default:
                    return 'reason';    
            }
        });
        
    newReasons.append('th')
        .attr('scope', 'row')
        .html(d => d.task_id.toString());
        
    newReasons.append('td')
        .html(d => d.task_name);
        
    newReasons.append('td')
        .attr('id', d => "rank" + d.task_id)
        .attr('class', 'editable rank')
        .html(d => d.ranking_name);
        
    newReasons.append('td')
        .attr('id', d => "rationale" + d.task_id)
        .attr('class', 'editable rationale')
        .html(d => d.rationale);
        
    newReasons.append('td')
        .attr('id', d => 'strategies' + d.task_id)
        .attr('class', 'editable strategies')
        .html(d => d.strategies);
};

var editField = function(thisDatum: Rationale) {
    var thisField = d3.select(this);
    var fieldID = thisField.attr('id');
    var curValue = thisField.text();

    // disable the click handler since it interferes with everything we want to do
    thisField.on('click', null);
    
    if (fieldID.indexOf("rank") == 0) {
        thisField.html('<select id="' + fieldID + '-edit" class="form-control"></select>');
        
        thisField.select('select').selectAll('option')
            .data(rankings, d => d.ranking_id.toString()).enter()
            .append('option')
                .attr('value', d => d.ranking_id)
                .text(d => d.ranking_name);
                
        thisField.selectAll("option").filter(d => d.ranking_name == curValue)
            .attr('selected', 'selected');
        $("select", this).focus();
            
        thisField.select('select').on('blur', function(d) {
            var selection = $("option:selected", this);
            console.log("committing ranking to database (rank %s, rank_id %d, task_id %d)",
                selection.text(),
                +selection.val(),
                +thisDatum.task_id
            );
            
            $.getJSON("utils/commitEdit.php", {
                'av1': av1,
                'av2': av2,
                'rank_id': selection.val(),
                'task_id': thisDatum.task_id 
            }, function(retData) {
                if (retData.result == "success") {
                    thisField.html(selection.text() + '<span class="glyphicon glyphicon-ok"></span>');
                    thisField.select(".glyphicon-ok").transition()
                        .delay(5000)
                        .duration(500)
                        .style('opacity', '1e-6')
                        .remove();
                    d3.selectAll('tr.reason').filter(d => d.task_id == thisDatum.task_id)
                        .classed('success', selection.text() == "Yes")
                        .classed('warning', selection.text() == "Doable")
                        .classed('danger', ["Need support", "Nonsensical", "Impossible"].indexOf(selection.text()) != -1);
                } else {
                    thisField.html(selection.text() + '<span class="glyphicon glyphicon-alert" data-toggle="tooltip" title="' + retData.message + '"></span>')
                }
                
                thisField.on('click', editField);
            });
            
        });
    } else {
        var textType: string;
        if (fieldID.indexOf('rationale') == 0)
            textType = 'rationale';
        if (fieldID.indexOf('strategies') == 0)
            textType = 'strategies';
        
        if (curValue == "??") curValue = "";
        thisField.html('<input id="' + fieldID + '" class="form-control" />');
        thisField.select('input').attr('value', curValue);
        
        $("input", this).keypress(function(event) { 
            if (event.charCode == 13) {
                event.preventDefault();
                $(this).trigger('blur');
            } 
        }).focus();
        
        thisField.select('input').on('blur', function(d) {
            var enteredText = $(this).val();
            console.log("committing text input to database (text: %s, task_id %d)", enteredText, +thisDatum.task_id); 
            
            var paramObj ={
                'av1': av1,
                'av2': av2,
                'task_id': thisDatum.task_id 
            };
            paramObj[textType] = enteredText;
            
            $.getJSON("utils/commitEdit.php", paramObj, function(retData) {
               if (retData.result == "success") {
                   thisField.html(enteredText + '<span class="glyphicon glyphicon-ok"></span>');
                   thisField.select(".glyphicon-ok").transition()
                    .delay(5000)
                    .duration(500)
                    .style('opacity', '1e-6')
                    .remove();
                } else {
                    thisField.html(enteredText + '<span class="glyphicon glyphicon-alert" data-toggle="tooltip" title="' + retData.message + '"></span>');
                }
                
                thisField.on('click', editField);
            });
        });
    }
};


$(document).ready(() => {
    $.getJSON("utils/getAttribsTasks.php", createInterface);
});
