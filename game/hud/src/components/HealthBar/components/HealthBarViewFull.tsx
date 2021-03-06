/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

import * as React from 'react';
import styled from 'react-emotion';
import { Faction } from '@csegames/camelot-unchained';

import { HealthBarValues } from '../index';
import ClassIndicator from './ClassIndicator';
import SmallBar from './SmallBar';
import BigBar from './BigBar';
import HealthSlideOut from './HealthSlideOut';

const Container = styled('div')`
  position: relative;
  height: 301px;
  width: 623px;
  -webkit-animation: ${(props: any) => props.shouldShake ? 'shake-hard 0.15s forwards' : ''}
  animation: ${(props: any) => props.shouldShake ? 'shake-hard 0.15s forwards' : ''}
  filter: ${(props: any) => props.isAlive ? 'grayscale(0%)' : 'grayscale(100%)'};
  -webkit-filter: ${(props: any) => props.isAlive ? 'grayscale(0%)' : 'grayscale(100%)'};
`;

const ContentContainer = styled('div')`
  position: relative;
  width: 100%;
  height: 100%;
  left: 118px;
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
`;

const Name = styled('div')`
  color: white;
  max-width: 375px;
  font-size: 32px;
  line-height: 32px;
  margin-left: 50px;
  overflow: hidden;
  word-wrap: break-word;
`;

const ContainerOverlay = styled('div')`
  position: absolute;
  background: url(images/healthbar/regular/main_frame.png);
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
    background: #E30000;
    -webkit-mask-image: linear-gradient(to top, black ${(props: any) => props.percent}%,
      transparent ${(props: any) => props.percent}%);
    -webkit-mask-size: 100% 100%;
  }
`;

const BloodCount = styled('div')`
  position: absolute;
  left: 15px;
  bottom: -20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  width: 76px;
  height: 22px;
  background: url(images/healthbar/regular/blood_number.png);
  z-index: 10;
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
  -webkit-mask-image: url(images/healthbar/regular/stamina_mask.png);
  -webkit-mask-size: 100% 100%;

  &:after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: ${(props: any) => props.percent}%;
    transition: width 0.1s;
    -webkit-transition: width 0.1s;
    height: 100%;
    background: linear-gradient(to top, #C2FFC8, #4CB856);
  }
`;

export interface HealthBarViewProps extends HealthBarValues {
  faction: Faction;
  shouldShake: boolean;
  isAlive: boolean;
  name: string;
  currentStamina: number;
  currentBlood: number;
}

export interface HealthBarViewState {

}

class HealthBarView extends React.Component<HealthBarViewProps, HealthBarViewState> {
  public render() {
    return (
      <Container shouldShake={this.props.shouldShake} isAlive={this.props.isAlive}>
        <ContentContainer>
          <NameContainer>
            <Name>{this.props.name}</Name>
          </NameContainer>
          <ClassIndicator top={15} left={140} width={70} height={70} borderRadius={35} faction={this.props.faction} />
          <BloodBall percent={this.props.bloodPercent}>
            <BloodCount>{this.props.currentBlood}</BloodCount>
          </BloodBall>
          <HealthSlideOut
            right={65}
            height={208}
            currentStamina={this.props.currentStamina}
            bodyPartsCurrentHealth={this.props.bodyPartsCurrentHealth}
          />
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
        </ContentContainer>
        <ContainerOverlay />
      </Container>
    );
  }
}

export default HealthBarView;
