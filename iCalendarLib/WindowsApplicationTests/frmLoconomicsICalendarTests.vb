Public Class frmLoconomicsICalendarTests


#Region "Create Event"


    ''' <summary>
    ''' Create Event
    ''' </summary>
    ''' <param name="sender"></param>
    ''' <param name="e"></param>
    ''' <remarks></remarks>
    Private Sub btnEventCreate_Click(sender As Object, e As EventArgs) Handles btnEventCreate.Click

        Try



            ' Create a Calendar Event
            Dim objCalendarEvents As New CalendarDll.Data.CalendarEvents

            'Fill the Event with Information
            With objCalendarEvents
                .UserId = 0

            End With

            Dim objEventUtilities As New CalendarDll.EventsUtilities




        Catch ex As Exception
            MessageBox.Show(ex.Message)
        End Try

    End Sub


#End Region



End Class
