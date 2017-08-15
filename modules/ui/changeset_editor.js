import * as d3 from 'd3';
import _ from 'lodash';
import { d3combobox } from '../lib/d3.combobox.js';
import { t } from '../util/locale';
import { svgIcon } from '../svg';
import { uiField } from './field';
import { uiFormFields } from './form_fields';
import { utilRebind } from '../util';


export function uiChangesetEditor(context) {
    var dispatch = d3.dispatch('change'),
        formFields = uiFormFields(context),
        fieldsArr,
        tags,
        changesetId;



    function changesetEditor(selection) {
        render(selection);
    }


    function render(selection) {
        var initial = false;

        if (!fieldsArr) {
            initial = true;
            var presets = context.presets();

            fieldsArr = [
                uiField(context, presets.field('comment'), null, { show: true, revert: false }),
                uiField(context, presets.field('source'), null, { show: false, revert: false }),
                uiField(context, presets.field('hashtags'), null, { show: false, revert: false }),
            ];

            fieldsArr.forEach(function(field) {
                field
                    .on('change', function(t, onInput) {
                        dispatch.call('change', field, t, onInput);
                    });
            });
        }

        fieldsArr.forEach(function(field) {
            field
                .tags(tags);
        });


        selection
            .call(formFields.fieldsArr(fieldsArr));


        if (initial) {
            var commentField = selection.select('#preset-input-comment'),
                commentNode = commentField.node();

            if (commentNode) {
                commentNode.focus();
                commentNode.select();
            }

            var osm = context.connection();
            if (osm) {
                osm.userChangesets(function (err, changesets) {
                    if (err) return;

                    var comments = changesets.map(function(changeset) {
                        return {
                            title: changeset.tags.comment,
                            value: changeset.tags.comment
                        };
                    });

                    commentField
                        .call(d3combobox()
                            .container(context.container())
                            .caseSensitive(true)
                            .data(_.uniqBy(comments, 'title'))
                        );
                });
            }
        }

        var matches = tags.comment.match(/google/i);
        var commentWarning = selection.select('.form-field-comment').selectAll('.comment-warning')
            .data(matches ? [0] : []);

        commentWarning.exit()
            .transition()
            .style('opacity', 0)
            .remove();

        var commentEnter = commentWarning.enter()
            .insert('div', '.tag-reference-body')
            .attr('class', 'field-warning comment-warning')
            .style('opacity', 0);

        commentEnter
            .append('a')
            .attr('target', '_blank')
            .attr('tabindex', -1)
            .call(svgIcon('#icon-alert', 'inline'))
            .attr('href', t('commit.google_warning_link'))
            .append('span')
            .text(t('commit.google_warning'));

        commentEnter
            .transition()
            .style('opacity', 1);


        // var changeSetInfo = fieldSection.append('div')
        //     .attr('class', 'changeset-info');

        // changeSetInfo.append('a')
        //     .attr('target', '_blank')
        //     .attr('tabindex', -1)
        //     .call(svgIcon('#icon-out-link', 'inline'))
        //     .attr('href', t('commit.about_changeset_comments_link'))
        //     .append('span')
        //     .text(t('commit.about_changeset_comments'));

    }


    changesetEditor.tags = function(_) {
        if (!arguments.length) return tags;
        tags = _;
        // Don't reset fieldsArr here.
        return changesetEditor;
    };


    changesetEditor.changesetID = function(_) {
        if (!arguments.length) return changesetId;
        if (changesetId === _) return changesetEditor;
        changesetId = _;
        fieldsArr = null;
        return changesetEditor;
    };


    return utilRebind(changesetEditor, dispatch, 'on');
}
