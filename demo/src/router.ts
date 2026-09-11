// Generouted, changes to this file will be overridden
/* eslint-disable */

import { components, hooks, utils } from '@generouted/react-router/client'

export type Path =
  | `/`
  | `/canvas`
  | `/canvas/details`
  | `/canvas/stateful`
  | `/site`
  | `/slides`
  | `/slides/:slideshowId`
  | `/stateful`

export type Params = {
  '/slides/:slideshowId': { slideshowId: string }
}

export type ModalPath = never

export const { Link, Navigate } = components<Path, Params>()
export const { useModals, useNavigate, useParams } = hooks<Path, Params, ModalPath>()
export const { redirect } = utils<Path, Params>()
