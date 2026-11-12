import type { Browser, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, openCameraMenu, openDevice, openInviteSheet, openPeerConnections, openWatchers, rotateKey, test, watchers } from './devices'

async function watchedRoom(browser: Browser, prepareViewer?: (viewer: Page) => Promise<void>) {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await prepareViewer?.(viewer)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno', { exact: true }))
  return { camera, viewer, key }
}

test('rotating the key from "Stanno guardando" expels the viewer and shows the new key, with which the viewer re-enters', async ({ browser }) => {
  const { camera, viewer, key } = await watchedRoom(browser)

  const newKey = await rotateKey(camera)

  await expect(viewer.getByRole('alert')).toHaveText('La Chiave è stata rigenerata: per rientrare serve la Chiave nuova.')
  await expect(viewer.getByLabel('Telecamera soggiorno', { exact: true })).toHaveCount(0)
  await expect.poll(() => openPeerConnections(camera)).toBe(0)
  const sheet = camera.getByRole('dialog', { name: 'Stanno guardando', exact: true })
  await expect(watchers(camera)).toHaveCount(0)
  await expect(sheet.getByText('Nessuno, per ora.')).toBeVisible()
  expect(newKey).toMatch(/^[a-z]+(?:-[a-z]+){3}$/)
  expect(newKey).not.toBe(key)
  await sheet.getByRole('button', { name: 'Chiudi', exact: true }).click()
  await openCameraMenu(camera)
  const invitation = await openInviteSheet(camera)
  await expect(invitation.getByRole('status', { name: 'Link per entrare', exact: true })).toHaveText(new RegExp(`#${newKey}&Casa al mare$`))

  await viewer.getByRole('link', { name: 'Entra in una Stanza', exact: true }).click()
  await joinAsViewer(viewer, newKey, 'Andrea')

  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno', { exact: true }))
})

test('the camera drops an expelled viewer that ignores the expulsion', async ({ browser }) => {
  const { camera, viewer } = await watchedRoom(browser, async (viewer) => {
    await viewer.routeWebSocket(/\/realtime\//, (socket) => {
      const server = socket.connectToServer()
      server.onMessage((message) => {
        if (!String(message).includes('key_rotated'))
          socket.send(message)
      })
    })
    // The route takes effect on the next document only.
    await viewer.reload()
  })

  await rotateKey(camera)

  await expect.poll(() => openPeerConnections(camera)).toBe(0)
  await expect(viewer.getByRole('alert')).toHaveCount(0)
})

test('rotating the key asks for confirmation first', async ({ browser }) => {
  const { camera, viewer } = await watchedRoom(browser)
  const sheet = await openWatchers(camera)

  await sheet.getByRole('button', { name: 'Rigenera la Chiave', exact: true }).click()
  const confirmation = camera.getByRole('dialog', { name: /^Rigenerare la Chiave\?/ })
  await confirmation.getByRole('button', { name: 'Annulla', exact: true }).click()

  await expect(confirmation).toBeHidden()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno', { exact: true }))
  await expect(watchers(camera)).toHaveCount(1)
  await expect(sheet.getByRole('list', { name: 'Chiave della Stanza', exact: true })).toHaveCount(0)
})

test('closing the room tells the viewer and the key stops working', async ({ browser }) => {
  const { camera, viewer, key } = await watchedRoom(browser)

  const menu = await openCameraMenu(camera)
  await menu.getByRole('button', { name: 'Chiudi la Stanza', exact: true }).click()
  const confirmation = camera.getByRole('dialog', { name: /^Chiudere la Stanza\?/ })
  await confirmation.getByRole('button', { name: 'Annulla', exact: true }).click()
  await expect(confirmation).toBeHidden()
  await expect(menu).toBeVisible()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno', { exact: true }))
  await menu.getByRole('button', { name: 'Chiudi la Stanza', exact: true }).click()
  await confirmation.getByRole('button', { name: 'Chiudi', exact: true }).click()

  await expect(viewer.getByRole('alert')).toHaveText('Stanza chiusa')
  await expect(viewer.getByLabel('Telecamera soggiorno', { exact: true })).toHaveCount(0)
  await expect(camera.getByRole('alert')).toHaveText('Stanza chiusa')

  await viewer.getByRole('link', { name: 'Entra in una Stanza', exact: true }).click()
  await joinAsViewer(viewer, key, 'Andrea')

  await expect(viewer.getByRole('alert')).toHaveText('Chiave non valida')
})
