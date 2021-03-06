/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

import * as React from 'react';
import styled from 'react-emotion';
import { utils, Faction } from '@csegames/camelot-unchained';

import { HealthBarValues } from '../index';
import ClassIndicator from './ClassIndicator';
import SmallBar from './SmallBar';
import BigBar from './BigBar';
// import HealthSlideOut from './HealthSlideOut';

const Container = styled('div')`
  position: relative;
  height: 301px;
  width: 506px;
  -webkit-animation: ${(props: any) => props.shouldShake ? 'shake-hard 0.15s forwards' : ''}
  animation: ${(props: any) => props.shouldShake ? 'shake-hard 0.15s forwards' : ''}
  filter: ${(props: any) => props.isAlive ? 'grayscale(0%)' : 'grayscale(100%)'};
  -webkit-filter: ${(props: any) => props.isAlive ? 'grayscale(0%)' : 'grayscale(100%)'};
`;

const NameContainer = styled('div')`
  position: absolute;
  top: 7px;
  left: 187px;
  display: flex;
  align-items: center;
  height: 79px;
  width: 505px;
  background: url(images/healthbar/regular/name-bg.png) no-repeat;
  background-size: contain;
  z-index: -1;
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 79px;
    width: 505px;
    background: linear-gradient(to right, ${(props: any) => props.factionColor}, transparent 60%);
    opacity: 0.4;
    z-index: -1;
  }
`;

const Name = styled('div')`
  color: white;
  max-width: 375px;
  font-size: 32px;
  line-height: 32px;
  margin-left: 50px;
  overflow: hidden;
  word-wrap: break-word;
  text-shadow: 1px 1px #000;
`;

const ContainerOverlay = styled('div')`
  position: absolute;
  background: url(images/healthbar/regular/main_frame_compact.png);
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
`;

const BloodBall = styled('div')`
  position: absolute;
  left: 30px;
  bottom: 25px;
  width: 105px;
  height: 105px;
  border-radius: 52.5px;
  background: #440000;

  &:after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 52.5px;
    background: linear-gradient(to bottom, #E30000, #2D0000);
    -webkit-mask-image: linear-gradient(to top, black ${(props: any) => props.percent}%,
      transparent ${(props: any) => props.percent}%);
    -webkit-mask-size: 100% 100%;
  }
`;

const HealthPillsContainer = styled('div')`
  position: absolute;
  top: 87px;
  left: 163px;
  width: 333px;
  height: 185px;
`;

const StaminaBar = styled('div')`
  position: relative;
  width: 104%;
  height: 15px;
  left: -25px;
  background: linear-gradient(to top, #303030, #1D1D1D);
  -webkit-mask-image: ${(props: any) => props.percent > 99.8 ? 'url(images/healthbar/regular/stamina_mask.png)' : ''};
  -webkit-mask-size: 100% 100%;

  &:after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: ${(props: any) => props.percent}%;
    height: 100%;
    background: linear-gradient(to top, #C2FFC8, #4CB856);
  }
`;

// This is commented out because it will not be shown by default but will be a toggle in the options menu.
// The toggle in the options menu has not been built yet so for now just hiding this.

// const BloodCount = styled('div')`
//   position: absolute;
//   left: 15px;
//   bottom: -20px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   color: white;
//   width: 76px;
//   height: 22px;
//   background: url(images/healthbar/regular/blood_number.png);
//   z-index: 10;
// `;

export interface HealthBarViewProps extends HealthBarValues {
  faction: Faction;
  shouldShake: boolean;
  isAlive: boolean;
  name: string;
}

export interface HealthBarViewState {

}

class HealthBarView extends React.Component<HealthBarViewProps, HealthBarViewState> {
  public render() {
    const factionColor = {
      [Faction.Arthurian]: '#581212',
      [Faction.Viking]: '#1B3A50',
      [Faction.TDD]: '#404515',
    };
    return (
      <Container shouldShake={this.props.shouldShake} isAlive={this.props.isAlive}>
        <NameContainer factionColor={factionColor[this.props.faction]}>
          <Name>{this.props.name}</Name>
        </NameContainer>
        <ClassIndicator top={15} left={140} width={75} height={75} borderRadius={37.5} faction={this.props.faction} />
        <BloodBall percent={this.props.bloodPercent}>
          {/* <BloodCount>{this.props.currentBlood}</BloodCount> */}
        </BloodBall>
        {/*
          This is commented out because it will not be shown by default but will be a toggle in the options menu.
          The toggle in the options menu has not been built yet so for now just hiding this.
          <HealthSlideOut
            right={-45}
            height={208}
            currentStamina={this.props.currentStamina}
            bodyPartsCurrentHealth={this.props.bodyPartsCurrentHealth}
          />
        */}
        <HealthPillsContainer>
          <SmallBar
            height={21}
            isAlive={this.props.isAlive}
            healthPercent={this.props.rightArmHealthPercent}
            wounds={this.props.rightArmWounds}
          />
          <SmallBar
            height={21}
            isAlive={this.props.isAlive}
            healthPercent={this.props.leftArmHealthPercent}
            wounds={this.props.leftArmWounds}
          />
          <BigBar
            left={5}
            height={41}
            isAlive={this.props.isAlive}
            healthPercent={this.props.headHealthPercent}
            wounds={this.props.headWounds}
          />
          <BigBar
            left={5}
            height={41}
            isAlive={this.props.isAlive}
            healthPercent={this.props.torsoHealthPercent}
            wounds={this.props.torsoWounds}
          />
          <SmallBar
            height={21}
            isAlive={this.props.isAlive}
            healthPercent={this.props.rightLegHealthPercent}
            wounds={this.props.rightLegWounds}
          />
          <SmallBar
            height={21}
            isAlive={this.props.isAlive}
            healthPercent={this.props.leftLegHealthPercent}
            wounds={this.props.leftLegWounds}
          />
          <StaminaBar percent={this.props.staminaPercent} />
        </HealthPillsContainer>
        <ContainerOverlay />
      </Container>
    );
  }

  public shouldComponentUpdate(nextProps: HealthBarViewProps, nextState: HealthBarViewState) {
    return !utils.numEqualsCloseEnough(nextProps.staminaPercent, this.props.staminaPercent) ||
      !utils.numEqualsCloseEnough(nextProps.headHealthPercent, this.props.headHealthPercent) ||
      !utils.numEqualsCloseEnough(nextProps.torsoHealthPercent, this.props.torsoHealthPercent) ||
      !utils.numEqualsCloseEnough(nextProps.rightArmHealthPercent, this.props.rightArmHealthPercent) ||
      !utils.numEqualsCloseEnough(nextProps.leftArmHealthPercent, this.props.leftArmHealthPercent) ||
      !utils.numEqualsCloseEnough(nextProps.rightLegHealthPercent, this.props.rightLegHealthPercent) ||
      !utils.numEqualsCloseEnough(nextProps.leftLegHealthPercent, this.props.leftLegHealthPercent) ||
      !utils.numEqualsCloseEnough(nextProps.bloodPercent, this.props.bloodPercent) ||
      nextProps.headWounds !== this.props.headWounds ||
      nextProps.torsoWounds !== this.props.torsoWounds ||
      nextProps.rightArmWounds !== this.props.rightArmWounds ||
      nextProps.rightLegWounds !== this.props.rightLegWounds ||
      nextProps.leftArmWounds !== this.props.leftArmWounds ||
      nextProps.leftLegWounds !== this.props.leftLegWounds ||
      nextProps.isAlive !== this.props.isAlive ||
      nextProps.name !== this.props.name;
  }
}

export default HealthBarView;
