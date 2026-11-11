import { expect } from '@playwright/test'
import { cameraThumbnails, createRoom, expectAdvancingVideo, expectFrozenVideo, heldWakeLocks, hideAndShow, joinAsCamera, joinAsCameraWithKey, joinAsViewer, openCameraMenu, openDevice, openPeerConnections, releaseWakeLocks, setVisibility, test } from './devices'

const screenMayTurnOff = /^Il browser non tiene acceso lo schermo: se si spegne, la telecamera smette di trasmettere\./

test('the camera keeps the screen on', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await expect.poll(() => heldWakeLocks(camera)).toBe(1)
})

test('the camera takes the screen lock back when it becomes visible again', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expect.poll(() => heldWakeLocks(camera)).toBe(1)

  await setVisibility(camera, 'hidden')
  await releaseWakeLocks(camera)
  await setVisibility(camera, 'visible')

  await expect.poll(() => heldWakeLocks(camera)).toBe(1)
})

test('the camera warns while the browser takes the screen lock back and refuses it again, until the screen is kept on', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expect.poll(() => heldWakeLocks(camera)).toBe(1)

  await camera.context().clearPermissions()
  await releaseWakeLocks(camera)

  await expect(camera.getByRole('alert')).toHaveText(screenMayTurnOff)

  await camera.context().grantPermissions(['screen-wake-lock'])
  await hideAndShow(camera)

  await expect.poll(() => heldWakeLocks(camera)).toBe(1)
  await expect(camera.getByRole('alert')).toHaveCount(0)
})

test('the camera warns that the screen may turn off when the browser refuses to keep it on, also while resting', async ({ browser }) => {
  const camera = await openDevice(browser, { permissions: [] })
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')

  await expect(camera.getByRole('alert')).toHaveText(screenMayTurnOff)

  await camera.getByRole('button', { name: 'Oscura lo schermo' }).click()

  await expect(camera.getByRole('region', { name: 'Schermata a riposo' }).getByRole('alert')).toHaveText(screenMayTurnOff)
})

test('the camera films again for its viewers after losing the camera while hidden', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const feed = viewer.getByLabel('Telecamera soggiorno')
  await expectAdvancingVideo(feed)

  await camera.getByLabel('Anteprima').evaluate((preview: HTMLVideoElement) =>
    (preview.srcObject as MediaStream).getVideoTracks().forEach(track => track.stop()))
  await expectFrozenVideo(feed)
  await hideAndShow(camera)

  await expectAdvancingVideo(feed)
  await expectAdvancingVideo(camera.getByLabel('Anteprima'))
  expect(await openPeerConnections(camera)).toBe(1)
})

test('on its first start only, the camera is told to stay open and plugged in, and that the screen dims by itself', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  const notice = camera.getByText('Tieni l\'app aperta e il telefono in carica: se blocchi lo schermo la trasmissione si ferma. Lo schermo si oscura da solo dopo 2 minuti.', { exact: true })
  await expect(notice).toBeVisible()
  await expect(cameraThumbnails(viewer)).toHaveCount(1)
  await expect(viewer.getByText('in carica')).toHaveCount(0)

  await camera.getByRole('button', { name: 'Ho capito' }).click()

  await expect(notice).toBeHidden()

  await camera.reload()

  await expectAdvancingVideo(camera.getByLabel('Anteprima'))
  await expect(camera.getByText('in carica')).toHaveCount(0)
  await expect(camera.getByRole('button', { name: 'Ho capito' })).toHaveCount(0)
})

test('the camera rests on a black screen saying it is live and listing its viewers, and wakes up on a tap', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')

  await camera.getByRole('button', { name: 'Oscura lo schermo' }).click()

  const rest = camera.getByRole('region', { name: 'Schermata a riposo' })
  await expect(rest).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  await expect(rest.getByText('In diretta', { exact: true })).toBeVisible()
  await expect(rest.getByRole('list', { name: 'Spettatori' })).toHaveText(['Andrea'])
  await expect(camera.getByLabel('Anteprima')).toBeHidden()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  await rest.click()

  await expect(rest).toBeHidden()
  await expectAdvancingVideo(camera.getByLabel('Anteprima'))
})

test('the camera dims its screen after two minutes without touches or keys, and a tap brings back the framing', async ({ browser }) => {
  const camera = await openDevice(browser)
  await camera.clock.install()
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const viewer = await openDevice(browser)
  await joinAsViewer(viewer, key, 'Andrea')
  const preview = camera.getByLabel('Anteprima')
  const rest = camera.getByRole('region', { name: 'Schermata a riposo' })
  await expectAdvancingVideo(preview)

  await camera.getByRole('heading', { name: 'soggiorno' }).click()
  await camera.clock.fastForward('01:50')
  await camera.keyboard.press('Shift')
  await camera.clock.fastForward('01:50')
  await expect(preview).toBeVisible()

  await camera.clock.fastForward('00:10')

  await expect(rest).toBeVisible()
  await expect(preview).toBeHidden()
  await expectAdvancingVideo(viewer.getByLabel('Telecamera soggiorno'))

  await rest.click()

  await expect(rest).toBeHidden()
  await expectAdvancingVideo(preview)

  await camera.clock.fastForward('02:00')

  await expect(rest).toBeVisible()
})

test('a camera left with its menu open dims its screen too, and a tap brings back the framing', async ({ browser }) => {
  const camera = await openDevice(browser)
  await camera.clock.install()
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const preview = camera.getByLabel('Anteprima')
  const rest = camera.getByRole('region', { name: 'Schermata a riposo' })
  await expectAdvancingVideo(preview)
  const menu = await openCameraMenu(camera)

  await camera.clock.fastForward('02:00')
  await expect(rest).toBeVisible()
  await rest.click()

  await expect(rest).toBeHidden()
  await expect(menu).toBeHidden()
  await expectAdvancingVideo(preview)
})

test('a paused camera says so on its rest screen', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await (await openCameraMenu(camera)).getByRole('button', { name: 'Metti in pausa' }).click()

  await camera.getByRole('button', { name: 'Oscura lo schermo' }).click()

  const rest = camera.getByRole('region', { name: 'Schermata a riposo' })
  await expect(rest.getByText('In pausa', { exact: true })).toBeVisible()
  await expect(rest.getByText('In diretta', { exact: true })).toHaveCount(0)
})

test('a resting camera shows that the room was closed', async ({ browser }) => {
  const camera = await openDevice(browser)
  const key = await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  const other = await openDevice(browser)
  await joinAsCameraWithKey(other, key, 'cucina')
  await camera.getByRole('button', { name: 'Oscura lo schermo' }).click()
  await expect(camera.getByRole('region', { name: 'Schermata a riposo' })).toBeVisible()

  await (await openCameraMenu(other)).getByRole('button', { name: 'Chiudi la Stanza' }).click()
  await other.getByRole('dialog', { name: /^Chiudere la Stanza\?/ }).getByRole('button', { name: 'Chiudi', exact: true }).click()

  await expect(camera.getByRole('region', { name: 'Schermata a riposo' })).toBeHidden()
  await expect(camera.getByRole('alert')).toHaveText('Stanza chiusa')
})

test('a device with a single camera offers no lens choice', async ({ browser }) => {
  const camera = await openDevice(browser)
  await createRoom(camera, 'Casa al mare')
  await joinAsCamera(camera, 'soggiorno')
  await expectAdvancingVideo(camera.getByLabel('Anteprima'))

  await expect(camera.getByRole('button', { name: 'Cambia obiettivo' })).toHaveCount(0)
})
