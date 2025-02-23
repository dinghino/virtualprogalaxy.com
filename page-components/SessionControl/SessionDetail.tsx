import { useState } from 'react'

import { useSession } from 'next-auth/react'
import { XOctagonFill } from 'react-bootstrap-icons'
import useSWR from 'swr'
import { Suspense } from 'react'
import {
  Button,
  Container,
  createStyles,
  Grid,
  Modal,
  Paper,
  ScrollArea,
  SimpleGrid,
  Table,
  Text,
  TextInput,
  Box,
} from '@mantine/core'
import { useForm } from '@mantine/form'
// Users with a higher priority will preempt the control of lower priority users.
import { IconActivity, IconArrowBack, IconPlus, IconPoint } from '@tabler/icons'
import { currentUser } from '@/utils/recoil/user'
import { BASE_URL } from '@/config/constants'

import { fetcher } from '@/lib/fetcher'
import { IPropsSessionData } from '@/types'
import { useRecoilValue } from 'recoil'
import { useRouter } from 'next/router'
const useStyles = createStyles((theme) => ({
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    margin: '10px,10px,10px,10px',
  },
  detail: {
    marginTop: '100px',
  },
}))

const fetchSessionData = async (url: string, _id: string) => {
  const session_data = await fetcher(`${BASE_URL.SERVER}/api/session/getSessionByID`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      _id: _id,
    }),
  })
  return session_data ? session_data : []
}
/***
 * * Custom Hook for useSWR
 * ? There mighe be more easier wway?
 */
const useSessionData = (_id: string) => {
  const { data, mutate, error, isValidating } = useSWR(['api/session/getSessionByID', _id], fetchSessionData, {
    revalidateOnFocus: false,
  })
  return {
    data: data,
    isLoading: (!error && !data) || isValidating,
    isError: error,
    mutate: mutate,
  }
}

const SessionDetail = ({ sessionID }: IPropsSessionData) => {
  const router = useRouter()
  const userEmail = useRecoilValue(currentUser)
  const { data: session, status } = useSession()
  const [opened, setOpened] = useState(false)
  const [isHandling, setIsHandling] = useState(false)
  const { classes, theme } = useStyles()
  const { data: detailData, isLoading, isError, mutate } = useSessionData(sessionID)

  const handleActivateSession = async (_id) => {
    setIsHandling(true)
    const response = await fetcher('/api/session/activateSessionByID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator: session.user.email,
        _id: _id,
      }),
    })
    mutate()
    setIsHandling(false)
  }
  const handleKillSession = async (_id) => {
    setIsHandling(true)
    const response = await fetcher('/api/session/killSessionByID', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _id: _id,
      }),
    })
    mutate()
    setIsHandling(false)
  }
  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (value.length < 1 ? 'Name Field Required' : null),
    },
  })
  const handleAllowUser = async (values) => {
    const { email } = values
    setOpened(false)

    setIsHandling(true)
    const response = await fetcher('/api/session/allowUsertoSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator: detailData.creator,
        _id: detailData._id,
        email: email,
      }),
    })
    mutate()
    setIsHandling(false)
  }
  const handleDenyAllowedUser = async (values) => {
    const email = values
    setIsHandling(true)
    const response = await fetcher('/api/session/denyUsertoSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creator: detailData.creator,
        _id: detailData._id,
        email: email,
      }),
    })
    mutate()
    setOpened(false)
    setIsHandling(false)
  }
  return (
    <Container className={classes.container}>
      {/* <LoadingOverlay
            visible={isHandling || isLoading}
            overlayBlur={2}></LoadingOverlay> */}
      <Modal
        title="Allow User"
        opened={opened}
        onClose={() => setOpened(false)}
        overlayColor={theme.colorScheme === 'dark' ? theme.colors.dark[9] : theme.colors.gray[2]}
        overlayOpacity={0.55}
        overlayBlur={3}>
        <Text>Allow New User to Access this Session</Text>
        <form onSubmit={form.onSubmit((values) => handleAllowUser(values))}>
          <SimpleGrid cols={1}>
            <TextInput placeholder="Name" label="User Email" withAsterisk {...form.getInputProps('email')} />
            <Button type="submit" radius="md" size="md">
              Allow
            </Button>
          </SimpleGrid>
        </form>
      </Modal>

      <Paper shadow="md" p="xl" style={{}} className="classes.detail">
        {detailData && (
          <Box
            sx={(theme) => ({
              display: 'flex',
              justifyContent: 'space-between',
              align: 'center',
              alignItems: 'center',
              marginTop: '30px',
            })}>
            <Text
              component="span"
              variant="gradient"
              gradient={{ from: 'indigo', to: 'green', deg: 0 }}
              weight={700}
              style={{
                fontFamily: 'Greycliff CF, sans-serif',
                fontSize: '30px',
              }}>
              {detailData.name}
            </Text>
            <Button.Group>
              {detailData.isActive ? (
                <Button
                  compact
                  size="sm"
                  leftIcon={<IconActivity />}
                  onClick={() => handleKillSession(detailData._id)}
                  color="red">
                  {' '}
                  Stop
                </Button>
              ) : (
                <Button
                  compact
                  size="sm"
                  leftIcon={<IconActivity />}
                  onClick={() => handleActivateSession(detailData._id)}>
                  {' '}
                  Activate
                </Button>
              )}
              <Button
                compact
                size="sm"
                leftIcon={<IconArrowBack size={18} stroke={1.5} />}
                color="orange"
                pr={20}
                onClick={() => {
                  router.push('./')
                }}>
                Back
              </Button>
            </Button.Group>
          </Box>
        )}
        {detailData && (
          <Grid columns={12}>
            <Grid.Col span={12} fw={700} fs="italic">
              <Text size="xl" c="blue">
                Description
              </Text>
            </Grid.Col>

            <Grid.Col span={12}>
              <Text size="xl">{detailData.description}</Text>
            </Grid.Col>

            <Grid.Col span={10} fw={700} c="blue">
              <Text size="xl" fs="italic">
                Allowed Users
              </Text>
            </Grid.Col>
            <Grid.Col
              span={2}
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
              <Button
                onClick={() => {
                  setOpened(true)
                }}
                color="green"
                variant="outline"
                compact
                loading={isHandling}
                leftIcon={
                  <IconPlus
                    onClick={() => {
                      setOpened(true)
                    }}
                    size={18}
                    stroke={1.5}
                  />
                }>
                New
              </Button>
            </Grid.Col>

            {detailData.users.length === 0 ? (
              <Grid.Col span={12}>
                <Text ta="center" size="xl" color="red">
                  No Users Available
                </Text>
              </Grid.Col>
            ) : (
              <>
                <Grid.Col span={12} style={{}}>
                  <ScrollArea style={{ height: 450 }}>
                    <Table withBorder withColumnBorders>
                      <thead>
                        <tr>
                          <th> Email</th>
                          <th> Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.users.map((user, index) => {
                          return (
                            <tr key={index}>
                              <td>
                                <Text size="xl" span>
                                  {user.email}
                                </Text>
                              </td>
                              <td>
                                <Button
                                  onClick={() => handleDenyAllowedUser(user.email)}
                                  color="orange"
                                  variant="subtle">
                                  <XOctagonFill />
                                </Button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </ScrollArea>
                </Grid.Col>
              </>
            )}
          </Grid>
        )}
      </Paper>
    </Container>
  )
}

export default SessionDetail
