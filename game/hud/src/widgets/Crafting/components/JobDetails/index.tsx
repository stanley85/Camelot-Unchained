/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * @Author: Mehuge (mehuge@sorcerer.co.uk)
 * @Date: 2017-05-04 21:36:32
 * @Last Modified by: Mehuge (mehuge@sorcerer.co.uk)
 * @Last Modified time: 2017-06-17 12:12:14
 */

import * as React from 'react';
import { connect } from 'react-redux';
import { GlobalState } from '../../services/session/reducer';
import { DropDownSelect } from 'camelot-unchained';
import { Ingredient } from '../../services/types';
import { Item, Template, Recipe, InventoryItem } from '../../services/types';
import { StyleSheet, css, merge, jobDetails, JobDetailsStyles } from '../../styles';
import Ingredients from '../Ingredients';

import Label from '../Label';
import Button from '../Button';
import Select from '../Select';
import RecipeSelect from '../RecipeSelect';
import TemplateSelect from '../TemplateSelect';
import NameInput from '../NameInput';
import QualityInput from '../QualityInput';
import QuantityInput from '../QuantityInput';
import VoxMessage from '../VoxMessage';
import OutputItems from '../OutputItems';

import { JobState, RecipesState, TemplatesState } from '../../services/session/reducer';

interface JobDetailsReduxProps {
  totalCraftingTime?: number;
  remaining?: number;
  outputItems?: InventoryItem[];
  status?: string;
  type?: string;
}

const select = (state: GlobalState, props: JobDetailsProps) : JobDetailsReduxProps => {
  const job = state.job;
  return {
    remaining: state.ui.remaining,
    totalCraftingTime: job.totalCraftingTime,
    outputItems: job.outputItems,
    status: job.status,
    type: job.type,
  };
};

export interface JobDetailsProps extends JobDetailsReduxProps {
  start: () => void;
  collect: () => void;
  cancel: () => void;
  setQuality: (quality: number) => void;
  setCount: (count: number) => void;
  setName: (name: string) => void;
  setRecipe: (recipe: Recipe) => void;
  setTemplate: (template: Template) => void;
  addIngredient: (item: InventoryItem, qty: number) => void;
  removeIngredient: (ingredient: Ingredient) => void;
  style?: Partial<JobDetailsStyles>;
}

export const JobDetails = (props: JobDetailsProps) => {
  const ss = StyleSheet.create(merge({}, jobDetails, props.style));
  const buttonStyle = { container: jobDetails.button };
  const { type, status, outputItems, totalCraftingTime, remaining } = props;

  // enabled state of buttons
  const canStart = outputItems && outputItems.length && status === 'Configuring';
  const canCollect = status === 'Finished';
  const canCancel = status === 'Running';     // TODO: What is the actual status?
  const canQuality = type === 'refine';
  const canQuantity = type === 'make';

  // If no vox type set yet...
  if (!type) {
    return (
      <div className={css(ss.container)}>
        <div>Select a Job Type!</div>
        <VoxMessage/>
      </div>
    );
  }

  return (
    <div className={css(ss.container)}>
      <div className={css(ss.properties)}>
        {type === 'make' && <NameInput onChange={props.setName}/>}
        {type !== 'make' && <RecipeSelect onSelect={props.setRecipe}/>}
        {type === 'make' && <TemplateSelect onSelect={props.setTemplate}/>}
      </div>
      <Ingredients
        add={props.addIngredient}
        remove={props.removeIngredient}
        />
      <OutputItems/>
      <VoxMessage/>
      <div className={'job-details ' + css(ss.buttons)}>
        <QualityInput disabled={!canQuality} onChange={props.setQuality}/>
        <QuantityInput disabled={!canQuantity} onChange={props.setCount}/>
        <Button style={buttonStyle} disabled={!canStart} onClick={() => props.start()}>Start</Button>
        <Button style={buttonStyle} disabled={!canCollect} onClick={() => props.collect()}>Collect</Button>
        <Button style={buttonStyle} disabled={!canCancel} onClick={() => props.cancel()}>Cancel</Button>
      </div>
    </div>
  );
};

export default connect(select)(JobDetails);
