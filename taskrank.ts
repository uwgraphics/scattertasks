module Scattertasks {
    interface AbstractTasks {
        task_id: number;
        task_name: string;
        description?: string;
    }
    
    export interface DataAttribute {
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
    
    export class TableController {
        tableSelector: d3.Selection<any>;
        
        public tasks: AbstractTasks[] = [];
        public default_attribs: DataAttribute[] = [];
        public attrib_values: DataAttribute[] = [];
        public rankings: Rankings[] = [];
        
        public firstTime: boolean = true;
        
        public av1: number = -1;
        public av2: number = -1;
        
        constructor(tableSelector: d3.Selection<any>) {
            this.tableSelector = tableSelector;
        }
        
        // preserve the meaning of `this` even when called as a callback
        // see <http://stackoverflow.com/questions/20627138/typescript-this-scoping-issue-when-called-in-jquery-callback>
        createInterface = (data: PreData) => {
            this.tasks = data.tasks;
            this.default_attribs = data.default_attribs;
            this.attrib_values = data.attrib_values;
            this.rankings = data.rankings;
            
            d3.selectAll("#attrib1, #attrib2").selectAll('option')
                .data(this.attrib_values, d => d.attribute_id.toString()).enter()
                .append('option')
                    .attr('value', d => d.attribute_id)
                    .text(d => d.attribute_name);
            
            d3.select("#attrib2 > option:nth-child(2)").attr('selected', 'selected');
            $("#attrib1, #attrib2").trigger('change');
        };
    
        // preserve the meaning of `this` even when called as a callback, similar to above
        populateReasons = (data: Rationale[]) => {
            var tasksFromDB = data.map(d => d.task_id);
            var noBlanksData = this.tasks.map(t => { 
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
            
            this.populateReasonsTR(noBlanksData);
            this.tableSelector.selectAll('td.editable').on('click', this.editField(this));
        };
    
        populateReasonsTR(data: Rationale[]) {
            // we expect to have all 12 tasks, so just remove everything from the table
            this.tableSelector.selectAll('tr.reason').remove();
            
            // set up the default stuff (if no data for this data parameter pair and task exists in DB
            var reasons = this.tableSelector.selectAll('tr.reason').data(data, d => d.task_id.toString());
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
    
        // this is super ugly, but we need 'this' to be the d3 event target and 
        // 'thisTable' to be a reference to this object
        editField(thisTable: TableController): {(thisDatum: Rationale, i: number): void} {
            return function(thisDatum, i) {
                var thisField = d3.select(this);
                var fieldID = thisField.attr('id');
                var curValue = thisField.text();
            
                // disable the click handler since it interferes with everything we want to do
                thisField.on('click', null);
                
                if (fieldID.indexOf("rank") == 0) {
                    thisField.html('<select id="' + fieldID + '-edit" class="form-control"></select>');
                    
                    thisField.select('select').selectAll('option')
                        .data(thisTable.rankings, d => d.ranking_id.toString()).enter()
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
                            'av1': thisTable.av1,
                            'av2': thisTable.av2,
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
                            
                            thisField.on('click', thisTable.editField(thisTable));
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
                            'av1': thisTable.av1,
                            'av2': thisTable.av2,
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
                            
                            thisField.on('click', thisTable.editField(thisTable));
                        });
                    });
                }
            };
        };
    };
};

