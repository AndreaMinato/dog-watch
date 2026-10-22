import type { Browser, Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { createRoom, expectAdvancingVideo, joinAsCamera, joinAsViewer, members, openDevice, openPeerConnections, test } from './devices'

async function watchedRoom(browser: Browser, prepareViewer?: (viewer: Page) => Promise<void>) {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await prepareViewer?.(viewer)
  await joinAsViewer(viewer, key, 'Andrea')
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  return { camera, viewer, key }
}

async function confirm(page: Page, action: string, confirmation: string) {
  await page.getByRole('button', { name: action }).click()
  await page.getByRole('dialog').getByRole('button', { name: confirmation }).click()
}

test('rotating the key expels the viewer, who re-enters with the new key', async ({ browser }) => {
  const { camera, viewer, key } = await watchedRoom(browser)

  await confirm(camera, 'Rigenera la Chiave', 'Rigenera')

  await expect(viewer.getByRole('alert')).toHaveText('La Chiave è stata rigenerata: per rientrare serve la Chiave nuova.')
  await expect(viewer.getByLabel('Camera soggiorno')).toHaveCount(0)
  await expect.poll(() => openPeerConnections(camera)).toBe(0)
  await expect(members(camera)).toHaveCount(1)
  const newKey = camera.getByRole('status', { name: 'Chiave della Stanza' })
  await expect(newKey).toHaveText(/^[a-z]+(?:-[a-z]+){3}$/)
  await expect(newKey).not.toHaveText(key)
  await camera.getByRole('button', { name: 'Mostra link e QR' }).click()
  await expect(camera.getByRole('status', { name: 'Link per entrare' })).toHaveText(new RegExp(`#${await newKey.textContent()}$`))

  await joinAsViewer(viewer, (await newKey.textContent())!, 'Andrea')

  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
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

  await confirm(camera, 'Rigenera la Chiave', 'Rigenera')

  await expect.poll(() => openPeerConnections(camera)).toBe(0)
  await expect(viewer.getByRole('alert')).toHaveCount(0)
})

test('rotating the key asks for confirmation first', async ({ browser }) => {
  const { camera, viewer } = await watchedRoom(browser)

  await camera.getByRole('button', { name: 'Rigenera la Chiave' }).click()
  await camera.getByRole('dialog').getByRole('button', { name: 'Annulla' }).click()

  await expect(camera.getByRole('dialog')).toBeHidden()
  await expectAdvancingVideo(viewer.getByLabel('Camera soggiorno'))
  await expect(members(camera)).toHaveCount(2)
})

test('closing the room tells the viewer and the key stops working', async ({ browser }) => {
  const { camera, viewer, key } = await watchedRoom(browser)

  await camera.getByRole('button', { name: 'Chiudi la Stanza' }).click()
  await camera.getByRole('dialog').getByRole('button', { name: 'Annulla' }).click()
  await expect(members(camera)).toHaveCount(2)
  await confirm(camera, 'Chiudi la Stanza', 'Chiudi')

  await expect(viewer.getByRole('alert')).toHaveText('Stanza chiusa')
  await expect(viewer.getByLabel('Camera soggiorno')).toHaveCount(0)
  await expect(camera.getByRole('alert')).toHaveText('Stanza chiusa')

  await joinAsViewer(viewer, key, 'Andrea')

  await expect(viewer.getByRole('alert')).toHaveText('Chiave non valida')
})
