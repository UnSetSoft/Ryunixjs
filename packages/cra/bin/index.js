#!/usr/bin/env node
'use strict'
import { intro } from '@clack/prompts'
import colors from 'picocolors'
import MENU from './menu.js'
import { Init } from './utils/index.js'

intro(colors.bold(colors.yellow(`~ Welcome to CRA ~`)))

const {
  projectName,
  projectTemplate,
  projectAddons,
  projectVersion,
  installManager,
  addAddons,
} = await MENU()

await Init(
  projectName,
  projectTemplate,
  projectAddons,
  projectVersion,
  installManager,
  addAddons,
)
