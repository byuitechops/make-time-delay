/*eslint-env node, es6*/
/*eslint no-unused-vars:1*/
/*eslint no-console:0*/

/* In case the pre-import is not finished, it makes the time delay for not allowing the post-import fire    too early (it should be the first child module in the postImport) */

/* Put dependencies here */

/* Include this line only if you are going to use Canvas API */
const canvas = require('canvas-wrapper');

/* View available course object functions */
// https://github.com/byuitechops/d2l-to-canvas-conversion-tool/blob/master/documentation/classFunctions.md

module.exports = (course, stepCallback) => {
    /* Create the module report so that we can access it later as needed.
    This MUST be done at the beginning of each child module. */
    course.addModuleReport('make-time-delay');

    var courseName = course.info.fileName.split('.zip')[0];
    var delayCounter = 0,
        delayMaximum = 5,
        totalDelay = 0;

    function getModules(getModulesCallback) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules`, function (err, modules) {
            if (err) {
                course.throwErr('make-time-delay', err);
                getModulesCallback(err);
                return;
            }
            // due to async nature of the program, sometimes it may need some
            // time delay before it starts getting the modules
            // the if {...} handles that issue calling getModules recursively until it is the right time
            if (modules.length === 0) {
                course.throwWarning(
                    'make-time-delay',
                    `Course modules have not loaded yet for the "${courseName}" course (canvasOU: ${course.info.canvasOU}). Trying again.`
                );
                setTimeout(function () {
                    // the total time delay allowed is 15 seconds
                    // if it takes more the stepCallback will terminate the program
                    if (totalDelay >= 15) {
                        course.throwErr(
                            'make-time-delay',
                            `loading the course modules has taken more than "${totalDelay}" seconds`
                        );
                        stepCallback(err, course);
                        return;
                    }
                    getModules(getModulesCallback);
                }, 1000);
                delayCounter++;
                totalDelay++;
                if (delayCounter >= delayMaximum) {
                    course.throwWarning(
                        'make-time-delay',
                        `loading the course modules is taking more than "${totalDelay}" seconds`
                    );
                    delayCounter = 0;
                }
                return;
            }
            course.success(
                'make-time-delay',
                `All course modules have been loaded for the "${courseName}" course (canvasOU: ${course.info.canvasOU})`
            );
            getModulesCallback(null);
        });
    }

    getModules(function () {
        stepCallback(null, course);
    });
};
