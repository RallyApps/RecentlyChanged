function RecentlyChanged() {
    var that = this;
    this.display = function(element) {
        var appHeader = rally.sdk.ui.AppHeader;
        rally.sdk.ui.AppHeader.showPageTools(true);
        rally.sdk.ui.AppHeader.setHelpTopic("244");
        var taskTable,defectTable,storyTable,lastWorkDate;
        var rallyDataSource = new rally.sdk.data.RallyDataSource('__WORKSPACE_OID__',
                '__PROJECT_OID__',
                '__PROJECT_SCOPING_UP__',
                '__PROJECT_SCOPING_DOWN__');

        function createStoryTable(stories) {
            if (storyTable) {
                storyTable.destroy();
            }
            var tableConfig = {
                columnKeys:["FormattedID","Name"],
                columnHeaders:["ID", "Name"],
                columnWidths:["20%","80%"]
            };
            storyTable = new rally.sdk.ui.Table(tableConfig);
            rally.forEach(stories, function(story) {
                var link = new rally.sdk.ui.basic.Link({item: story});
                var row = {'FormattedID' : link, 'Name' : story.Name};
                storyTable.addRow(row);
            });
            storyTable.display("storyTable");
        }

        function createDefectTable(defects) {
            if (defectTable) {
                defectTable.destroy();
            }
            var tableConfig = {
                columnKeys:["FormattedID","Name"],
                columnHeaders:["ID", "Name"],
                columnWidths:["20%","80%"]
            };
            defectTable = new rally.sdk.ui.Table(tableConfig);
            rally.forEach(defects, function(defect) {
                var link = new rally.sdk.ui.basic.Link({item: defect});
                var row = {'FormattedID' : link, 'Name' : defect.Name};
                defectTable.addRow(row);
            });
            defectTable.display("defectTable");
        }

        function createTaskTable(tasks) {
            if (taskTable) {
                taskTable.destroy();
            }
            var todoTotal = 0;

            dojo.forEach(tasks, function(task) {
                task.ParentName = new rally.sdk.ui.basic.Link({
                    item: task.WorkProduct,
                    text: task.WorkProduct.FormattedID + ' ' + task.WorkProduct.Name});
                task.FormattedIDLink = new rally.sdk.ui.basic.Link({item:task});
                task.Owner = task.Owner === null ? "" : task.Owner._refObjectName;
                todoTotal += task.ToDo;
                task.ToDo = task.ToDo === null ? "" : task.ToDo.toFixed(2);
            });

            var config = {
                columnKeys:["FormattedIDLink","ParentName","Name","ToDo","Owner"],
                columnHeaders:["ID", "Work Product", "Name", "To Do", "Owner"]
            };
            taskTable = new rally.sdk.ui.Table(config);
            taskTable.addRows(tasks);
            taskTable.display("tableDiv");
            var date = dojo.date.locale.format(lastWorkDate, {datePattern: "MMMM dd, yyyy", selector: "date"});
            dojo.byId("lastWorkDay").innerHTML = "Changed Since: " + date;
            dojo.byId("totalLabel").innerHTML = "To Do Total: " + todoTotal.toFixed(2);
        }

        function createTables(rallyData) {
            createTaskTable(rallyData.tasks);
            createStoryTable(rallyData.stories);
            createDefectTable(rallyData.defects);
        }

        function queryDataForTables(lastWorkDateWithoutTime) {
            var queries = [];
            queries.push({
                type:"task",
                key:"tasks",
                fetch:"WorkProduct,Name,FormattedID,ToDo,Owner",
                query: "(LastUpdateDate > " + lastWorkDateWithoutTime + ")",
                order: "LastUpdateDate desc"

            });

            queries.push({
                type:"HierarchicalRequirement",
                key:"stories",
                fetch:"Name,FormattedID",
                query: "(LastUpdateDate > " + lastWorkDateWithoutTime + ")",
                order: "LastUpdateDate desc"

            });

            queries.push({
                type:"Defect",
                key:"defects",
                fetch:"Name,FormattedID",
                query: "(LastUpdateDate > " + lastWorkDateWithoutTime + ")",
                order: "LastUpdateDate desc"
            });

            rallyDataSource.find(queries, createTables);
        }

        function execute() {

            function getCurrentDayOfWeek() {
                return dojo.date.locale.format(new Date(), {
                    datePattern:"EEEE",
                    selector:"date",
                    locale:'en-us'});
            }

            function getLastWorkDay(results) {
                var week = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
                var workDays = results.workspace[0].WorkDays.split(",");
                var currentDayName = getCurrentDayOfWeek();

                var lastWorkDay;
                var lastWorkDayIndex = dojo.indexOf(workDays, currentDayName) - 1;
                if (lastWorkDayIndex === -2 || lastWorkDayIndex === -1) {
                    lastWorkDay = workDays[workDays.length - 1];
                } else {
                    lastWorkDay = workDays[lastWorkDayIndex];
                }

                var daysSinceLastWorkDay = dojo.indexOf(week, currentDayName) - dojo.indexOf(week, lastWorkDay);
                daysSinceLastWorkDay = daysSinceLastWorkDay > 0 ? daysSinceLastWorkDay : daysSinceLastWorkDay + 7;

                var today = new Date();
                lastWorkDate = dojo.date.add(today, "day", -daysSinceLastWorkDay);
                var isoDate = dojo.date.stamp.toISOString(lastWorkDate);
                var lastWorkDateWithoutTime = isoDate.substring(0, isoDate.length - 15);
                queryDataForTables(lastWorkDateWithoutTime);
            }

            rallyDataSource.find({
                type:"WorkspaceConfiguration",
                key: "workspace",
                fetch: "WorkDays"
            }, getLastWorkDay);
        }

        execute();
    };
}