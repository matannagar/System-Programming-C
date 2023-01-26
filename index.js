'use strict';

define(
  [
    // RequireJS dependencies.
    'app',
    './directives/header',
    './directives/details',
    './directives/create-or-import',
    './directives/courses',
    './directives/course',
    './directives/invite',
    './directives/leagues',
  ],
  function (app) {
    app.controller('classSettingsCtrl', function ($scope, $q, classId, isNew, openStep, classSettingsHideTabs, direction, classroom, parentObj, hasStudents, league, isTeam, $http, $translate, $state, $mdDialog, Classes, Teams, Missions, Leagues, UserProfile, $rootScope, Google, $element, $cookies, Amplitude) {
      const wrapController = async () => {
        const CLASS_DIALOG_CONFIG = {
          create: {
            title: 'New Class',
            steps: [
              { label: 'Create Class', index: 1 },
              { label: 'Add Courses', index: 2 },
              { label: 'Invite Students', index: 3 }
            ]
          },
          edit: {
            title: 'Class Settings',
            steps: [
              { label: 'Class Info', index: 1 },
              { label: 'Edit Courses', index: 2 },
              { label: 'Invite Students', index: 3 }
            ]
          }
        }

        CLASS_DIALOG_CONFIG.edit.steps = CLASS_DIALOG_CONFIG.edit.steps.filter(item => !classSettingsHideTabs.includes(item.index))

        const TEAM_DIALOG_CONFIG = {
          create: {
            title: 'New Team',
            steps: [
              { label: 'New Team', index: 1 },
              { label: 'Select Division', index: 2 },
              { label: 'Invite Students', index: 3 }
            ]
          },
          edit: {
            title: 'Team Profile Settings',
            steps: [
              { label: 'Team Info', index: 1 },
              { label: null, index: 2 },
              { label: 'Invite Students', index: 3 }
            ]
          }
        }

        const TEAM_MAX_STUDENTS = 6
        const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 'other']
        const DEFAULT_CLASS_AVATAR = 'classroom-images/3.png'
        const USER_DATA_DEFAULT_STATE = {
          selectedClass: '',
          selectedCourses: {},
          selectedLeague: null,
          selectedCoursesIds: [],
          teamDescription: '',
          teamLogo: null,
          teamLogoFile: null,
          savedCoursesIds: [],
          numSelectedCourses: 0,
          grade: null,
          classAvatar: null,
          studentEmails: [],
          allStudents: [],
          selectedStudents: [],
          maxStudents: 0,
          studentsChanged: 0,
          studentsAdded: false,
          previousSelectedStudentsState: {
            allStudents: [],
            selectedStudents: [],
          }
        }

        let groups
        let classLicenses = []
        const currentDialogConfig = isTeam ? TEAM_DIALOG_CONFIG : CLASS_DIALOG_CONFIG
        const allowedStatus = ['active']
        const rosterImages = {
          'google': '/images/new-design/roster/classroom_color_logo.png',
          'classlink': '/images/new-design/roster/classlink_color_logo.png',
          'clever': '/images/new-design/roster/clever_color_logo.png'
        }

        $scope.loading = true
        $scope.direction = direction
        $scope.classId = classId
        $scope.updateResults = [];
        $scope.create = isNew === true
        $scope.isTeam = isTeam
        $scope.startFromPage = determineStartFromPageValue()
        $scope.currentStep = $scope.startFromPage
        $scope.classLicenses = {}
        $scope.shouldReloadCourses = true
        $scope.googleSelectedStudents = [];
        $scope.savedClass = null
        $scope.savedClassId = null
        $scope.isCreated = false
        $scope.userFormPages = [1,2]
        $scope.waitForCourseLicenses = null
        $scope.isAddStudentsMode = false
        $scope.formInfoRoster = {
          isAllowedToImportStudents: false,
          showImportButtonProvider: false,
          needsPermissionForImport: false,
          showAllowPermissionButton: false,
          rosterClasses: [],
          rosterImage: null,
          provider: null,
          chosen: false,
          autoSelectGrade: false
        }
        $scope.formInfo = [
          { roster: $scope.formInfoRoster },
          { schools: [], roster: $scope.formInfoRoster },
          { coursesList: [], selectedCourses: [], selectedLeague: null, allCourses: [], roster: $scope.formInfoRoster, studentCount: 0 },
          { roster: $scope.formInfoRoster, importError: null, classLocked: classroom ? (classroom.locked || false) : false }
        ]
        $scope.userData = { ...USER_DATA_DEFAULT_STATE }
        $scope.originalUserDataState = null

        handleScopeTranslations()

        $scope.grades = GRADES.map((n) => {
          const plurarized = plurarize(n)
          const text = (plurarized === 'Multigrade') ? $translate.instant('Multigrade')
            : `${$translate.instant(plurarized)} ${$translate.instant('Grade')}`

          return { value: n, text }
        })

        $scope.cancel = function () {
          $scope.updateResults = [];
          revertChanges(true)
          $mdDialog.cancel();
        };

        $scope.resetLoadingMessage = function() {
          $scope.loadingMessage = $translate.instant('Loading') + '...'
        }

        $scope.done = function () {
          if (!$scope.isTeam) {
            $state.go('dashboard.teacherClass', { classId: $scope.userData.id, courseId: "", packId: "", studentId: "" });
          }
          $mdDialog.hide($scope.userData.id);
        }

        $scope.save = async function () {
          let isSaved = $q.defer()
          if ($scope.create) {
            const newGroupId = ($scope.isTeam) ? await $scope.createTeam()
              : ($scope.formInfoRoster.chosen)
                ? await $scope.createClass(true)
                : await $scope.createClass()

            if (newGroupId) {
              $scope.classId = newGroupId

              try {
                if (!$scope.isTeam) {
                  const newClassDetails = await Classes.getDetails($scope.classId)
                  const { available_seats, students_count, unlimited = false } = newClassDetails.data.data
                  $scope.userData.maxStudents =
                  (!Number.isNaN(available_seats) && !unlimited) 
                  ? available_seats + students_count
                  : (unlimited) ? Infinity : null
                } else {
                  const newTeamDetails = await Teams.getDetails($scope.classId)
                  const newTeam = newTeamDetails.data.data
                  const max = league ? (league.players_per_team || TEAM_MAX_STUDENTS) : TEAM_MAX_STUDENTS
                  const maxStudents = newTeam.licenses[0].seats && (newTeam.licenses[0].seats > max) ? max : newTeam.licenses[0].seats
                  $scope.userData.maxStudents = maxStudents
                }
              } catch (e) {

              }
            }

            await getTeacherStudents()

            isSaved.resolve()
            $scope.isCreated = true
            $rootScope.$broadcast('student-class-changed');
            return isSaved.promise
          } else {
            $scope.isSaving = true
            if ($scope.isTeam) {
              $scope.savingInProgress = $translate.instant("Saving") + '...';
              const updateResult = await saveTeamInfo()
              await Teams.load()
              $scope.done = true;
              $mdDialog.hide($scope.classId)
              if (updateResult) {
                $rootScope.$broadcast('update-team-breadcrubms')
              }
            } else {
              if ($scope.currentStep === 1) {
                $scope.userData.roster ? saveClassInfo(true) : saveClassInfo()
              }
              if ($scope.currentStep === 2) {
                $scope.savingInProgress = $translate.instant("Saving") + '...';
                await $scope.saveCourses()
                $scope.shouldReloadCourses = true
              }
              $scope.savingInProgress = $translate.instant("Saving") + '...';
              Classes.load()
                .finally(function () {
                  // show updates
                  // $scope.done = true;
                  //$scope.finish();    //will be called on done click
                  $mdDialog.hide()
                });
            }
            $scope.isSaving = false
            // $scope.gotoNext();
          }
        }

        $scope.gotoStep = async function (step, isInit = false) {
          if (!$scope.create) {
            if (!isInit) {
              await handleUserLeavingTab()
              restoreOriginalUserDataState()
            }
            $scope.currentStep = step
          }
          if ($scope.shouldReloadCourses) await reloadLeaguesOrCourses()
        }

        $scope.gotoNext = function () {
          $scope.currentStep = $scope.currentStep + 1
        }

        $scope.gotoPrev = function () {
          $scope.currentStep = $scope.currentStep - 1
        }

        $scope.goto = async function (direction, isRosterChosen) {
          $scope.formInfoRoster.chosen = Boolean(isRosterChosen)

          if (direction === -1 && $scope.currentStep > $scope.startFromPage) {
            $scope.gotoPrev()
          } else if ($scope.currentStep < $scope.steps.length) {
            if ($scope.currentStep == 0 && $scope.formInfoRoster.chosen && $scope.formInfoRoster.needsPermissionForImport) {
              openWindowGooglePermissions()
              return
            }
            
            if ($scope.currentStep == 1 && $scope.shouldReloadCourses) {
              await reloadLeaguesOrCourses()
            } else if ($scope.currentStep == 2) {
              $scope.loading = true
              $scope.loadingMessage = $scope.create ? ($scope.isTeam ? $translate.instant('Creating Team') + ' ...' : $translate.instant('Creating Class') + ' ...') : $translate.instant('Loading') + ' ...'
              await $scope.save()
              $scope.loading = false
              $scope.resetLoadingMessage()
            }
            $scope.gotoNext()
          }
        }

        // - end getting schools
        $scope.loadLeagues = async function () {
          const blacklistedLicenses = await Leagues.getBlacklistedLicenses()
          const myGroups = await Teams.loadAdminGroupsIfNeeded()
          const allLeagues = await Leagues.load()
          const currentSchool = myGroups.find(mg => mg.id === $scope.userData.school)

          if (currentSchool) {
            const currentSchoolLeagues = currentSchool.licenses.filter(license => !license.revoked && !license.expired
              && !license.locked && !blacklistedLicenses.includes(license.product_id)).map(license => {
                const league = allLeagues.find(league => league.id === license.product_id)
                license.league = league
                return {
                  license,
                  key: license.id,
                  disabled: isDateExpired(license),
                  name: $translate.instant(league.name),
                  value: $translate.instant(league.name),
                  expiration_date: license.expiration_date
                    ? (new Date(license.expiration_date)).toLocaleDateString()
                    : '',
                  valid_through_date: license.valid_through_date
                    ? (new Date(license.valid_through_date)).toLocaleDateString()
                    : '',
                  course: license.league.course,
                  players_per_team: league.players_per_team
                }
              })
            $scope.formInfo[2].leaguesList = currentSchoolLeagues
          } else {
            $scope.formInfo[2].leaguesList = []
          }
        }

        $scope.loadCourses = async function () {
          if ($scope.waitForCourseLicenses) return
          if (!$scope.create) await getUpdatedTeamOrClassDetails()
          if (!classroom || classroom === -1) {
            // classId = $scope.userData.id;
            classLicenses = []
          } else {
            // update
            Classes.prepareForBestCourseSearch(classroom.courseLicenses)
            classLicenses = classroom.courseLicenses || []
          }

          parentObj = parentObj ?? Classes.getAdminGroupById($scope.userData.school, true)
          // update
          if (!$scope.create && classLicenses.length) {
            for (const license of classLicenses) {
              license.parent = parentObj.licenses.find(item => Classes.isParent(license.id, item.id))

              if (license.parent && !license.revoked && !license.expired) {
                license.parent.metadata.open_type_editable = license.parent.metadata.open_type_editable === undefined || license.parent.metadata.open_type_editable
                const id = license.parent.id
                $scope.userData.selectedCourses[id] = license

                if (license.parent.course) delete license.parent.course

                license.source = JSON.parse(JSON.stringify(license))

                if (!license.revoked && allowedStatus.includes(license.status)) {
                  $scope.userData.selectedCoursesIds.push(id);
                  $scope.userData.savedCoursesIds.push(id);
                }
                // sourceClassLicensesIds.push(id);
              }
            }
          }
          // end - update

          // getting user courses
          $scope.formInfo[2].coursesList = []
          $scope.waitForCourseLicenses = $q.defer()
          Missions.getUserCourses(async function (data) {
            parentObj = Classes.getAdminGroupById($scope.userData.school, true)
            const courseLicenses = parentObj.licenses.filter(l => l.product_type !== 'league')
            $scope.formInfo[2].allCourses = parentObj.licenses
            Classes.prepareForBestCourseSearch(courseLicenses)
            // $scope.formInfo[2].coursesList = []
            await Promise.all(courseLicenses.map(async license => {
              const course = Missions.findCourse(license.product_id)
              if (course) {
                license.course = course
                let item = {
                  seat_status: license.seat_status,
                  key: license.id,
                  productId: license.product_id,
                  expiration_date: license.expiration_date,
                  valid_through_date: license.valid_through_date,
                  disabled: !allowedStatus.includes(license.status) || !isCourseAvailable(license) || license.seat_status.available === 0,
                  isDateExpired: isDateExpired(license),
                  name: $translate.instant(course.name),
                  value: $translate.instant(course.name)
                }
                $scope.formInfo[2].coursesList.push(item);
              }
            })).then(values => {
              $scope.formInfo[2].coursesList.sort((a, b) => {
                return a.disabled === b.disabled ? 0 : a.disabled ? 1 : -1;
              })
              $scope.waitForCourseLicenses.resolve()
              $scope.waitForCourseLicenses = null
            })
          }, $scope.shouldReloadCourses)

          return $scope.waitForCourseLicenses.promise
        }

        // end - update
        $scope.createTeam = async function () {
          const waitForSave = $q.defer()

          if ($scope.create) {
            try {
              const res = await Teams.addNewTeam(
                $scope.userData.school,
                $scope.userData.selectedClass,
                $scope.userData.teamDescription,
                $scope.userData.selectedLeague,
                UserProfile.get().id,
                $scope.userData.grade
              )

              if ($scope.userData.teamLogoFile) {
                await uploadTeamLogo($scope.userData.teamLogoFile)
              }

              $scope.userData.id = res.id;
              $scope.userData.joinUrl = res.join_url;
              $scope.userData.classCode = res.code
              waitForSave.resolve(res.id)
            } catch (e) {
              console.log(e)
              waitForSave.reject()
            }
            return waitForSave.promise
          }
        }

        $scope.createClass = async function (roster = false) {
          const waitForSave = $q.defer()
          const licenses = []

          for (const key in $scope.userData.selectedCourses) {
            const license = $scope.userData.selectedCourses[key]
            licenses.push({ id: key, metadata: license.metadata })
            license.metadata.disabled_packs =
              (license.metadata && license.metadata.open_type === 'manual' && license.selectedPacks)
              ? license.parent.course.packs.map(i => i.id).filter(i => license.selectedPacks.indexOf(i) === -1)
              : license.metadata.disabled_packs || []
          }

          let payload = {}
          if ($scope.create) {
            payload = {
              // groupId: parent.id,
              name: $scope.userData.selectedClass,
              groupId: $scope.userData.school,
              teacherIds: [UserProfile.get().id],
              grade: $scope.userData.grade
            }

            if (roster) {
              payload.rosterSourceClassId = $scope.userData.selectedClass
              const rosterClass = $scope.formInfoRoster.rosterClasses.find((rc) => rc.key === $scope.userData.selectedClass)
              if (rosterClass) {
                payload.name = rosterClass.value
              }
            }
            payload.licenses = licenses.map(l => ({ isFlexible: true, ...l }))

            try {
              const res = await Classes.addNewClass(payload)

              const classSchool = groups.find(g => g.id === $scope.userData.school)
              Amplitude.log('LearningCenter_MyClasses_AddNewClass_Create', {
                class_group_id: res.classroom.id,
                org_admin_group_id: classSchool.id,
                district_group_id: classSchool.district_id
              })
              $scope.userData.id = res.classroom.id;
              $scope.userData.joinUrl = res.classroom.join_url;
              $scope.userData.classCode = res.classroom.code
              waitForSave.resolve(res.classroom.id)
            } catch (err) {
              if (err.data && err.data.code === 1003) {
                let seats = err.data.info.needed - err.data.info.available
                $scope.formInfo[3].importError = $translate.instant('This class needs') + ` ${seats} ` + $translate.instant('more seats')
              } else {
                $scope.formInfo[3].importError = $translate.instant(err.data.description)
              }
              waitForSave.reject()
            }
            return waitForSave.promise
          }
        }

        // update courses
        $scope.saveCourses = async function () {
          const waitForSave = $q.defer()
          let isResolved = false
          $scope.updateResults = [];

          for (const key in $scope.userData.selectedCourses) {
            const license = $scope.userData.selectedCourses[key]

            license.metadata.disabled_packs =
              (license.metadata && license.metadata.open_type === 'manual' && license.selectedPacks)
                ? $scope.formInfo[2].allCourses.find(c => c.id === key)
                  .course.packs.map(i => i.id)
                  .filter(i => license.selectedPacks.indexOf(i) === -1)
                : license.metadata.disabled_packs || []

            if (!$scope.userData.savedCoursesIds.includes(key)) {
              try {
                await Classes.addLicense($scope.classId, license.parent.id, license.metadata)
                // $scope.shouldReloadCourses = true
                // $scope.updateResults.push({ status: 'success', color: 'green', msg: license.parent.course.name + ' ' + $translate.instant('added successfully') });
              } catch (e) {
                // $scope.updateResults.push({ status: 'fail', color: 'red', msg: license.parent.course.name + ' ' + $translate.instant('cant be added') + "," + e.description });
              }
            }
            else {
              const sourceLicense = classLicenses.find(l => key === l.parent.id && !l.revoked)
              license.source = sourceLicense ? sourceLicense.source : null
              license.id = sourceLicense.id
              if (license.source && isModified(license)) {
                try {
                  await Classes.updateLicense($scope.classId, license)
                  // $scope.shouldReloadCourses = true
                  // $scope.updateResults.push({ status: 'success', color: 'green', msg: license.parent.course.name + ' ' + $translate.instant('updated successfully') });
                } catch (e) {
                  // $scope.updateResults.push({ status: 'fail', color: 'red', msg: license.parent.course.name + ' ' + $translate.instant('cant be updated') + "," + e.description });
                }
              }
            }
            if (!isResolved) {
              isResolved = true
              waitForSave.resolve()
            }
          }

          if (!classLicenses || !classLicenses.length) return waitForSave.promise
          if (classLicenses && classLicenses.length) {
            for (const license of classLicenses) {
              if (!license.revoked && !$scope.userData.selectedCourses[license.parent.id]) { // if the license was in source but in the selected => delete
                try {
                  await Classes.revokeLicense($scope.classId, license)
                  // $scope.updateResults.push({ status: 'success', color: 'green', msg: license.parent.course.name + ' ' + $translate.instant('removed successfully') });
                } catch (e) {
                  // $scope.updateResults.push({ status: 'fail', color: 'red', msg: license.parent.course.name + ' ' + $translate.instant('cant be removed') + "," + e.description });
                }
              }
            }
            if (!isResolved) {
              isResolved = true
              waitForSave.resolve()
            }
          }
          return waitForSave.promise
        }

        $scope.validate = function () {
          if ($scope.create) {
            return $scope.isTeam ? validateNewTeam() : validateNewClass()
          } else {
            return $scope.isTeam ? validateSavedTeam() : validateSavedClass()
          }
        }

        $scope.archive = function (event) {
          const archiveAndLoad = async () => {
            $scope.archivingInProgress = $translate.instant("Archiving class") + '...';
            await archiveClass()
            Classes.load().finally(function () {
              $mdDialog.hide()
            });
          }

          const hasArchived = $cookies.get('has-archived-class')
          if (hasArchived) {
            archiveAndLoad()
          } else {
            $mdDialog.show({
              controllerAs: 'dialogCtrl',
              controller: function ($mdDialog) {
                this.action = function () {
                  $mdDialog.hide();
                  archiveAndLoad()
                  $cookies.put('has-archived-class', true);
                }
              },
              parent: document.querySelector('#dialog-child'),
              preserveScope: true,
              autoWrap: true,
              multiple: true,
              templateUrl: 'views/dashboard/class-settings/archive-class-alert.html'
            })
          }
        }

        $scope.unarchive = async function () {
          $scope.unarchivingInProgress = $translate.instant("Unarchiving class") + '...';
          await archiveClass(false)
          Classes.load().finally(function () {
            $mdDialog.hide()
          });
        }

        $scope.onGoogleClassChange = function (classId) {
          $scope.googleStudents = [];
          $scope.googleSelectedStudents = [];
          if (classId != -1) {
            // $scope.googleStudents = [{
            //   key: -1,
            //   value: "Loading Students ...",
            //   disabled: true
            // }];
            const _class = $scope.formInfoRoster.rosterClasses.find(c => c.key === classId)

            if (_class && _class.grade && isValidGrade(_class.grade)) {
              if (`${_class.grade}`.toLowerCase() !== 'other') {
                $scope.formInfoRoster.autoSelectGrade = true;
              }
              $scope.userData.grade = `${_class.grade}`.toLowerCase();
            } else {
              $scope.formInfoRoster.autoSelectGrade = false;
              $scope.userData.grade = null;
            }

            Google.getStudentCountInClass(classId).then(res => {
              $scope.formInfo[2].studentCount = res.data
              $scope.shouldReloadCourses = true;
              if ($scope.formInfoRoster.autoSelectSchool) {
                if (_class) {
                  $scope.userData.school = _class.schoolId
                } else {
                  $scope.userData.school = null
                }
              }

              // Google.getStudents(classId).then(function (data) {
              //   data = data.students;
              //   $scope.googleStudents = [];
              //   $scope.googleStudentsError = null;
              //   if (data) {
              //     Google.checkStudentsWithCoderZ(data.map(function (user) { return user.profile.emailAddress })).then(function (users) {
              //       var usersMap = {};
              //       for (var j = 0; j < users.length; j++) {
              //         usersMap[users[j].email] = users[j];
              //       }
              //       for (var i = 0; i < data.length; i++) {
              //         var user = usersMap[data[i].profile.emailAddress];
              //         $scope.googleStudents.push({
              //           key: data[i].profile.id,
              //           data: data[i],
              //           value: data[i].profile.name.fullName + "," + data[i].profile.emailAddress,
              //           disabled: !!user,
              //           tooltip: user ? (user.class_id && Classes.isMyClass(user.class_id) ? "Already your's student (Class: " + Classes.isMyClass(user.class_id).name + ")" : "Already CoderZ user") : null//need to show more data
              //         })
              //         if (!user) {
              //           $scope.googleSelectedStudents.push(data[i].profile.id);
              //         }
              //       }
              //     })
              //   } else {
              //     $scope.googleStudents = [{
              //       key: -1,
              //       value: "No students found",
              //       disabled: true
              //     }];
              //   }
              // })
            })
          }
        }

        $scope.syncRoster = async function () {
          $scope.syncButtonName = $translate.instant('Syncing') + '...'
          try {
            await saveRoster()
            $mdDialog.hide();
            $scope.syncButtonName = $translate.instant('Sync')
          } catch (e) {
          }
        }

        $scope.hasError = function () {
          return $scope.formInfo[3] && $scope.formInfo[3].importError
        }

        $scope.isRoster = function () {
          if (!$scope.create) {
            return $scope.userData.roster && $scope.userData.roster.enabled
          }
          const res = $scope.formInfoRoster.showImportButtonProvider ||
            $scope.formInfoRoster.needsPermissionForImport ||
            $scope.formInfoRoster.isAllowedToImportStudents


          return $scope.currentStep === 0 ? res : res && ($scope.formInfoRoster.chosen || $scope.savedClassId)
        }

        // end - Roster import

        $scope.$on('cancel-warning-dialogs',function(){
          $mdDialog.cancel()
        })

        $scope.unsavedWarning = function ({ intent, message }) {
          const dialogPromise = $q.defer()
          const originalDialog = $mdDialog
          const hasStudentsChanges = $scope.isAddStudentsMode && $scope.userData.studentsChanged
          const hasStudentsAdded = Boolean($scope.userData.studentsAdded)
          const validateBeforeSave = $scope.isTeam ? validateSavedTeam : validateSavedClass
          
          if ($scope.create && $scope.currentStep === 3) {
            originalDialog.hide({ action: 'redirect', classId: $scope.classId })
            return
          } else if (
            (!$scope.create && validateBeforeSave()) &&
            (!hasStudentsChanges && !hasStudentsAdded) ||
            ($scope.create && ($scope.currentStep === 1 || $scope.currentStep === 3)) ||
            ($scope.create && ($scope.currentStep === 2 && Object.keys($scope.userData.selectedCourses).length === 0)) ||
            ($scope.create && $scope.currentStep === 0)
          ) {
            originalDialog.hide(false)
          } else if (($scope.isCreated && !hasStudentsChanges) || hasStudentsAdded) {
            originalDialog.hide($scope.classId)
          } else {
            $mdDialog.show({
              parent: document.querySelector('#dialog-child'),
              controllerAs: 'dialogCtrl',
              controller: function ($mdDialog, $translate, message) {
                this.dialogMessage = message
                this.action = function (action) {
                  if (intent === 'leaveTab') { $mdDialog.hide({ close: action.close }) }
                  if (intent === 'closeForm') {
                    if (action.close) { originalDialog.hide(false) }
                    $mdDialog.hide(false);
                  }
                }
              },
              preserveScope: true,
              autoWrap: true,
              multiple: true,
              templateUrl: 'views/dashboard/class-settings/close-dialog-warning.html',
              locals: { message }
            }).then(result => {
              if (result.close) { dialogPromise.resolve() }
            })
            return dialogPromise.promise
          }
        }

        $scope.close = function () {
          $mdDialog.hide();
        }

        $scope.onSchoolChange = function (id) {
          $scope.formInfo[2].selectedCourses = []
          // $scope.formInfo[2].studentCount = 0

          $scope.userData = {
            selectedClass: $scope.userData.selectedClass, // don't change if already chosen
            grade: $scope.userData.grade, // don't change if already chosen
            school: id,
            ...USER_DATA_DEFAULT_STATE
          }
          $scope.shouldReloadCourses = true
        }

        $scope.setAddStudentsMode = function (isModeActive) {
          const updatePreviousSelectedStudentsState = () => {
            const { previousSelectedStudentsState, allStudents, selectedStudents } = $scope.userData
            if (isModeActive) {
              $scope.userData.previousSelectedStudentsState.allStudents = [...allStudents]
              $scope.userData.previousSelectedStudentsState.selectedStudents = [...selectedStudents]
            } else {
              $scope.userData.allStudents = [...previousSelectedStudentsState.allStudents]
              $scope.userData.selectedStudents = [...previousSelectedStudentsState.selectedStudents]
            }
          }

          updatePreviousSelectedStudentsState()
          $scope.isAddStudentsMode = isModeActive
          $scope.userData.studentsChanged = 0
          $scope.userData.studentsAdded = false
        }

        $scope.saveStudents = async function () {
          await Classes.addStudents($scope.classId, $scope.userData.selectedStudents.map(s => s.id))
          $scope.isAddStudentsMode = false
          $scope.userData.studentsAdded = true
          await getUpdatedTeamOrClassDetails()
        }

        $scope.toggleClassLock = async function () {
          const result = await Classes.setLock($scope.classId, !$scope.formInfo[3].classLocked)
          $scope.formInfo[3].classLocked = result.data.status
        }

        function revertChanges() {    // ?

        }

        function isValidGrade (grade) {
          return `${grade}`.toLowerCase() === 'other' || GRADES.some((g) => g == grade)
        }

        function plurarize (num) {
          const number = +num
          if (Number.isNaN(number)) return 'Multigrade'

          switch(number) {
              case 1:
                  return '1st'
              case 2:
                  return '2nd'
              case 3:
                  return '3rd'
              default:
                  return `${number}th`
          }
        }

        function determineStartFromPageValue () {
          if (isTeam)
            return 1
          else if (classSettingsHideTabs.length && CLASS_DIALOG_CONFIG.edit.steps.length)
            return CLASS_DIALOG_CONFIG.edit.steps[0].index
          else
            return openStep > -1 ? openStep : ($scope.create ? 0 : 1)
        }

        function handleScopeTranslations () {
          $scope.savingInProgress = $translate.instant("Save")
          $scope.archivingInProgress = $translate.instant("Archive class")
          $scope.unarchivingInProgress = $translate.instant("Unarchive class")
          $scope.loadingMessage = $translate.instant('Loading') + ' ...'
          $scope.syncButtonName = $translate.instant('Sync')
          if ($scope.create) {
            $scope.title = $translate.instant("New Class")
            $scope.steps = [
              { label: $translate.instant("Create Class") },
              { label: $translate.instant("Add Courses") },
              { label: $translate.instant("Invite Students") }
            ]
          } else {
            $scope.title = $translate.instant("Class Settings")
            $scope.steps = [
              { label: $translate.instant("Class Info") },
              { label: $translate.instant("Edit Courses") },
              { label: $translate.instant("Invite Students") }
            ]
          }

          const dialogTitle = $scope.create ? currentDialogConfig.create.title : currentDialogConfig.edit.title
          const dialogSteps = $scope.create ? currentDialogConfig.create.steps : currentDialogConfig.edit.steps

          $scope.title = $translate.instant(dialogTitle)
          $scope.steps = dialogSteps.map(s => ({ ...s, label: $translate.instant(s.label) }))
          $scope.leaveTabDialogMessage = $translate.instant(`It seems like you've made some changes to this page but didn't save them... So here is a friendly reminder before you leave this page`)
          $scope.closeDialogMessage = $translate.instant('If you quit now, your changes will not be saved.')
        }

        async function getSchoolsListIntoForm() {
          groups = (await Classes.loadAdminGroupsIfNeeded(true)).filter(g => !g.strict_subgroup_auto_sync)
          groups.forEach(item => {
            const list = []

            if (item.parent && item.type === 'org admin') list.push(item.parent.name)
            list.push(item.name)

            $scope.formInfo[1].schools.push({ value: list.join(' \\ '), key: item.id })
          })
        }

        async function handleUserLeavingTab() {
          await waitForInitialize()

          const waitForDialogAnswer = $q.defer()

          if (!$scope.validate() && $scope.userFormPages.includes($scope.currentStep)) {
            await $scope.unsavedWarning({ intent: 'leaveTab', message: $scope.leaveTabDialogMessage })
          }

          waitForDialogAnswer.resolve()
          return waitForDialogAnswer.promise
        }

        function saveOriginalUserDataState () {
          $scope.originalUserDataState = JSON.stringify($scope.userData)
        }

        function restoreOriginalUserDataState () {
          $scope.userData = JSON.parse($scope.originalUserDataState)
        }

        function isSeatsAvailable (license) {
          return license.seat_status.unlimited || license.seat_status.available >= $scope.formInfo[2].studentCount
        }

        function isDateExpired (license) {
          return license.expired
        }

        function isCourseAvailable (license) {
          return !isDateExpired(license) && isSeatsAvailable(license)
        }

        //  update
        function isModified(license) {
          if (license.is_new) {
            return true
          }
          if (license.source && license.source.metadata.open_type !== license.metadata.open_type) {
            return true
          }
          if (license.metadata.open_type === 'manual' && license.source && license.source.selectedPacks && arr_diff(license.source.selectedPacks, license.selectedPacks)) {
            return true
          }
          return false
        }

        function arr_diff(a1, a2) {
          if (a1.length != a2.length) return true

          for (let i = 0; i < a1.length; i++) {
            if (a2.indexOf(a1[i]) == -1) return true
          }

          return false
        }

        async function uploadTeamLogo (logoFile) {
          const data = { groupId: $scope.classId, img: logoFile }
          const options = {
            headers: { 'Content-Type': undefined },
            transformRequest: function (data) {
                const formData = new FormData();
                angular.forEach(data, function (value, key) {
                    formData.append(key, value);
                });
                return formData;
            }
          };

          await Teams.uploadTeamLogo(data, options)
        }

        async function saveTeamInfo () {
          const payload = {
            groupId: $scope.classId,
            name: $scope.userData.selectedClass,
            description: $scope.userData.teamDescription || '',
            grade: $scope.userData.grade
          }

          try {
            await Teams.editTeam(payload)
          } catch (e) {
            if (err.id == "error.duplicate_name_violation") $scope.showClassNameError = true
            return null
          }

          if ($scope.userData.teamLogoFile) {
            try {
              await uploadTeamLogo($scope.userData.teamLogoFile)
            } catch (e) {
              return null
            }
          }

          $scope.submitting = false
          return payload
        }

        // update class
        function saveClassInfo (roster = false) {
          const payload = { groupId: $scope.classId, grade: $scope.userData.grade }

          if (!roster) payload.name = $scope.userData.selectedClass
          if ($scope.userData.classAvatar) payload.image = $scope.userData.classAvatar.name

          Classes.editClass(payload)
            .then(function () {
              $rootScope.$broadcast('edited-class');
              $rootScope.$broadcast('student-class-changed');
            })
            .catch(function (err) {
              if (err.id == "error.duplicate_name_violation") {
                $scope.showClassNameError = true;
              }
            }).finally(function () {
              $scope.submitting = false;
            });
        };

        async function archiveClass (archive = true) {
          const payload = {
            groupId: $scope.classId,
            archive
          }

          return new Promise((resolve, reject) => {
            Classes.archiveClass(payload)
              .then(function () {
                resolve(true)
              })
              .catch(function (err) {
                reject()
              });
          })
        }

        async function getTeacherStudents () {
          $scope.isStudentsLoading = true
          const { data: allUsersData } = await UserProfile.loadTeacherStudents()
          const { data: classStudentsData } = await Classes.getStudents($scope.classId)
          $scope.userData.selectedStudents = classStudentsData.data.map(({ username, first_name, last_name, id}) => {
            return {
              username,
              id,
              classname: $scope.userData.selectedClass,
              full_name: [first_name, last_name].filter(s => s && s.length).join(' ')
            }
          })
          $scope.userData.allStudents = allUsersData
          $scope.isStudentsLoading = false
        }

        async function getTeamDetails () {
          if ($scope.getDetailsDefer) return $scope.getDetailsDefer.promise

          $scope.getDetailsDefer = $q.defer()
          const response = await Teams.getDetails($scope.classId)

          if (!$scope.create) {
            $scope.savedClass = response.data.data;
            $scope.savedClassId = $scope.savedClass.id;
            $scope.userData.selectedClass = $scope.savedClass.name;
            $scope.userData.grade = $scope.savedClass.grade;
            $scope.userData.teamLogo = $scope.savedClass.metadata.logo
            $scope.userData.teamDescription = $scope.savedClass.description;
            $scope.userData.classCode = $scope.savedClass.code;
            $scope.userData.joinUrl = $scope.savedClass.join_url;
            $scope.userData.school = $scope.savedClass.id.substring(0 ,$scope.savedClass.id.length - 12);

            const max = league ? (league.players_per_team || TEAM_MAX_STUDENTS) : TEAM_MAX_STUDENTS
            const maxStudents = $scope.savedClass.licenses[0].seats && ($scope.savedClass.licenses[0].seats > max) ? $scope.savedClass.licenses[0].seats : max
            $scope.userData.maxStudents = maxStudents

            await getTeacherStudents()
            $scope.getDetailsDefer.resolve()
          }

          return $scope.getDetailsDefer.promise
        }

        async function getClassDetails () {
          if ($scope.getDetailsDefer) return $scope.getDetailsDefer.promise

          $scope.getDetailsDefer = $q.defer()
          const classImages = await Classes.getClassImages()

          $scope.classImages = classImages.data.map((name) => {
            return { name, url: window.getImagesBaseUrl() + "/group-images/" + name }
          })

          Classes.getDetails($scope.classId).then(async function (response) {
            if (!$scope.create) {
              $scope.savedClass = response.data.data;
              $scope.savedClassId = $scope.savedClass.id;
              $scope.userData.selectedClass = $scope.savedClass.name;
              $scope.userData.classCode = $scope.savedClass.code;
              $scope.userData.joinUrl = $scope.savedClass.join_url;
              $scope.userData.classAvatar = $scope.savedClass.metadata.image_name ? $scope.classImages.find((ci) => ci.name === $scope.savedClass.metadata.image_name) : $scope.classImages.find((ci) => ci.name === DEFAULT_CLASS_AVATAR);
              $scope.userData.school = $scope.savedClass.id.substring(0, $scope.savedClass.id.length - 12);
              $scope.userData.grade = $scope.savedClass.grade;
              $scope.userData.roster = $scope.savedClass.roster_metadata && Object.keys($scope.savedClass.roster_metadata).length > 0 ? $scope.savedClass.roster_metadata : null
              $scope.userData.disableEditGrade = $scope.savedClass.grade && $scope.savedClass.grade !== 'other' && $scope.userData.roster && $scope.userData.roster.enabled

              Classes.prepareForBestCourseSearch($scope.savedClass.courseLicenses)
              
              const { available_seats, students_count, unlimited = false } = $scope.savedClass

              if (!Number.isNaN(available_seats) && !unlimited) $scope.userData.maxStudents = available_seats + students_count
              else if (unlimited) $scope.userData.maxStudents = Infinity
              else $scope.userData.maxStudents = null

              await getTeacherStudents()

              if ($scope.userData.roster) {
                Google.getStudentCountInClass($scope.userData.roster.id).then(res => {
                  $scope.formInfo[2].studentCount = res.data
                })
              } else {
                $scope.formInfo[2].studentCount = $scope.savedClass.students_count || 0
              }
            }
            $scope.shouldReloadCourses = true
            handleRoster()
            $scope.getDetailsDefer.resolve()
            $scope.getDetailsDefer = null
          })

          return $scope.getDetailsDefer.promise;
        }

        function isCourseActive (c) {
          return c.status === "active" && !c.locked && !c.revoked
        } 

        function validateSavedTeam () {
          const handleStep1Validation = () => {
            const isNameEquals = $scope.savedClass.name === $scope.userData.selectedClass
            const isDescEquals = $scope.savedClass.description === $scope.userData.teamDescription
            const isGradeEquals = $scope.savedClass.grade === $scope.userData.grade
            const isNoClass = !$scope.userData.selectedClass || !$scope.userData.selectedClass.length
            const logoNotChanged = !$scope.userData.teamLogoFile
            return isNameEquals && isDescEquals && logoNotChanged && isGradeEquals || isNoClass
          }
          const handleStep3Validation = () => {
            // in case there will be any checks later...
            return true
          }

          if ($scope.userData && $scope.savedClass) {
            if ($scope.currentStep === 1) return handleStep1Validation()
            if ($scope.currentStep === 3) return handleStep3Validation()
            return false;
          }
          return true;
        }

        function validateSavedClass () {
          const checkSelectedCoursesEqualsSavedCourses = () => {
            const activeSelectedCourses = Object.keys($scope.userData.selectedCourses).map(key => $scope.userData.selectedCourses[key]).filter(isCourseActive)
            const activeSavedCourses = $scope.savedClass && $scope.savedClass.courseLicenses.length
              ? $scope.savedClass.courseLicenses.filter(isCourseActive) : []
              
            return activeSavedCourses.length === activeSelectedCourses.length
          }
          const handleStep1Validation = () => {
            if ($scope.userData.roster && $scope.savedClass.roster_metadata.id === $scope.userData.selectedClass && $scope.savedClass.grade === $scope.userData.grade) {
              return true
            } else if ($scope.savedClass && $scope.savedClass.name === $scope.userData.selectedClass && $scope.savedClass.grade === $scope.userData.grade
              && ($scope.userData.classAvatar && (($scope.savedClass.metadata && !$scope.savedClass.metadata.image_name && $scope.userData.classAvatar.name === DEFAULT_CLASS_AVATAR)
              || ($scope.userData.classAvatar.name === $scope.savedClass.metadata.image_name)))) {
              return true;
            } else if (!$scope.userData.selectedClass || !$scope.userData.selectedClass.length) {
              return true;
            }
            
            return false
          }
          const handleStep2Validation = () => {
            const selectedCourses = Object.keys($scope.userData.selectedCourses)
            const hasModified = selectedCourses.reduce((acc, key) => acc || isModified($scope.userData.selectedCourses[key]), false)

            if (hasModified) {
              return selectedCourses.reduce((acc, key) => {
                const license = $scope.userData.selectedCourses[key]
                return acc || (license.metadata.open_type === 'manual' && !license.selectedPacks.length)
              }, false)
            }

            return checkSelectedCoursesEqualsSavedCourses()
          }
          
          if (!$scope.userData) return true
          if (handleStep1Validation() && handleStep2Validation()) return true

          return false
        }

        function validateNewClass () {
          if ($scope.currentStep === 1) {
            return !$scope.userData.selectedClass.length || !$scope.userData.school || !$scope.userData.grade
          }
          if ($scope.currentStep === 2) {
            if (!Object.keys($scope.userData.selectedCourses).length)
              return true
            for (const key in $scope.userData.selectedCourses) {
              if ($scope.userData.selectedCourses[key].metadata.open_type === 'manual' &&
                $scope.userData.selectedCourses[key].selectedPacks.length === 0
              ) {
                return true
              }
            }
          }
          if ($scope.currentStep === 3) {

          }
        }

        function validateNewTeam () {
          if ($scope.currentStep === 1) {
            return !$scope.userData.selectedClass.length || !$scope.userData.school || !$scope.userData.grade
          }
          if ($scope.currentStep === 2) {
            return !$scope.userData.selectedLeague || !$scope.userData.isTeamsAvailable
          }
          if ($scope.currentStep === 3) {

          }
        }

        // Roster import
        function isRosterAllowed(verifyApproved = false) {
          let d = null
          if (verifyApproved) {
            d = $q.defer()
          }
          if ($scope.roster && $scope.roster.enabled) {
            handleRoster()
          } else {
            $scope.loading = true
            UserProfile.rosterIsAllowed()
              .then(async (res) => {
                if (res.data === true) {
                  // $scope.showSendEmailInvites = false
                  $scope.formInfoRoster.showImportButtonProvider = !hasStudents
                  $scope.formInfoRoster.isAllowedToImportStudents = true
                  $scope.formInfoRoster.provider = UserProfile.get().sso_provider
                  $scope.formInfoRoster.rosterImage = rosterImages[$scope.formInfoRoster.provider]
                  $scope.classesTitle = $translate.instant($scope.formInfoRoster.provider.charAt(0).toUpperCase() + $scope.formInfoRoster.provider.slice(1))
                  try {
                    const res = await importStudents()
                    $scope.loading = res.loading
                    if (verifyApproved) {
                      $scope.gotoNext()
                    }
                  } catch (e) {
                    $scope.loading = false
                  }
                } else if (res.data === false) {
                  if (!$scope.create && verifyApproved) { // in case settings click doesn't have permissions
                    $mdDialog.hide()
                  }
                  $scope.formInfoRoster.showImportButtonProvider = false
                  $scope.formInfoRoster.isAllowedToImportStudents = false
                  $scope.loading = false
                } else if (res.data.length && res.data.length > 0) {
                  if (!$scope.create && verifyApproved) { // in case settings click doesn't have permissions
                    $mdDialog.hide()
                  }
                  // $scope.formInfoRoster.showSendEmailInvites = false
                  $scope.formInfoRoster.needsPermissionForImport = true
                  $scope.formInfoRoster.showImportButtonProvider = !hasStudents
                  $scope.formInfoRoster.provider = UserProfile.get().sso_provider
                  $scope.classesTitle = $translate.instant($scope.formInfoRoster.provider.charAt(0).toUpperCase() + $scope.formInfoRoster.provider.slice(1))
                  $scope.formInfoRoster.rosterImage = rosterImages[$scope.formInfoRoster.provider]
                  $scope.permissionsLink = res.data
                  $scope.formInfoRoster.showImportButtonProvider = false
                  if (verifyApproved) {
                    d.resolve({ loading: false })
                  }
                  if ($scope.create && !verifyApproved) {
                    $scope.loading =  false
                  }
                  if (!$scope.create && !verifyApproved) {
                    $scope.loading =  false
                  }
                }
              })
          }
          if (verifyApproved) {
            return d.promise
          }
        }

        function openWindowGooglePermissions() {
          $scope.loading = true
          allowPermissions($scope.allowAccessUrl)
        }

        function handleRoster() {
          if ($scope.userData.roster) {
            $scope.userData.roster.locked = true; // ?
            $scope.userData.selectedClass = $scope.userData.roster.id;
            UserProfile.rosterIsAllowed()
              .then((res) => {
                if (res.data === true) {

                  $scope.formInfoRoster.isAllowedToImportStudents = true
                  $scope.formInfoRoster.syncButtonEnabled = true
                  UserProfile.rosterGetMyClasses().then(data => {
                    $scope.formInfoRoster.rosterClasses = []
                    data.data.forEach(c => {
                      $scope.formInfoRoster.rosterClasses.push({ key: c.id, value: c.name })
                    })
                    $scope.formInfoRoster.showGrantAccessButton = false
                  }).catch(e => {
                    console.log(e)
                  })
                } else if (res.data === false) {
                  $scope.syncButtonEnabled = false
                } else if (res.data.length && res.data.length > 0) {
                  $scope.loading = true
                  $scope.formInfoRoster.isAllowedToImportStudents = false
                  $scope.formInfoRoster.showGrantAccessButton = true
                  $scope.formInfoRoster.syncButtonEnabled = false
                  openWindowGooglePermissions()
                  return
                }
              })
          }
        }

        function allowPermissions() {
          $scope.allowPermissionsWindow = window.open($scope.permissionsLink, 'GrantPermissions', 'resizable,scrollbars,status')
          const timer = setInterval(function () {
            if ($scope.allowPermissionsWindow.closed) {
              clearInterval(timer)
              isRosterAllowed(true).then(data => {
                $scope.loading = data.loading
                if (data.allowed) {
                  $scope.gotoNext()
                }
              })
            }
          }, 1000);
        }

        function importStudents() {
          let d = $q.defer()
          if ($scope.formInfoRoster.isAllowedToImportStudents) {
            $scope.loadingClassesError = false
            // $scope.showClasses = true
            $scope.loading = true
            $scope.formInfoRoster.showImportButtonProvider = false
            UserProfile.rosterGetMyClasses().then(data => {
              $scope.formInfoRoster.rosterClasses = []
              data.data.forEach(c => {
                $scope.formInfoRoster.rosterClasses.push({ key: c.id, value: c.name, schoolId: c.school_group_id, grade: c.grade  })
              })
              if($scope.formInfoRoster.rosterClasses.some(c => c.schoolId)) {
                $scope.formInfoRoster.rosterClasses = $scope.formInfoRoster.rosterClasses.filter(c => c.schoolId)
                $scope.formInfoRoster.autoSelectSchool = true
              }
              $scope.formInfo[1].showGrantAccessButton = false
              $scope.formInfoRoster.showImportButtonProvider = false
              if (d) {
                d.resolve({ loading: false, allowed: true })
              }
              // $scope.formInfoRoster.showSendEmailInvites = true
            }).catch(e => {
              console.log(e)
              // $scope.showClasses = false
              $scope.loading = false
              // $scope.showImportButtonProvider = !hasStudents
              $scope.loadingClassesError = true
              // $scope.formInfoRoster.showSendEmailInvites = true
              d.reject()
            })
          }

          if ($scope.formInfoRoster.needsPermissionForImport === true) {
            $scope.formInfoRoster.showGrantAccessButton = true
            $scope.formInfoRoster.showImportButtonProvider = false
          } else {
            $scope.formInfoRoster.showGrantAccessButton = false
          }
          return d.promise
        }

        async function saveRoster(newClassId) {
          $scope.submitting = true;
          const waitForRosterSave = $q.defer()
          const emails = $scope.userData.studentEmails.map(function (email) { return email })
          const promises = [];
          if ($scope.userData.selectedClass !== '-1') {
            try {
              const res = await UserProfile.rosterImportClass({ classId: $scope.userData.selectedClass, groupId: classroom ? classroom.id : $scope.userData.id })
              waitForRosterSave.resolve()
            } catch (err) {
              if (err.data && err.data.code === 1003) {
                const seats = err.data.info.needed - err.data.info.available
                $scope.formInfo[3].importError = $translate.instant('This class needs') + ` ${seats} ` + $translate.instant('more seats')
              } else {
                $scope.formInfo[3].importError = $translate.instant(err.data.description)
              }
              $scope.submitting = false;
              waitForRosterSave.reject()
              // return waitForRosterSave.promise
            }
          } else {
            promises.push(Classes.inviteStudentsToClass($scope.classId, emails));
          }

          if ($scope.googleSelectedStudents.length) {
            const new_students = $scope.googleStudents.filter(function (data) {
              return $scope.googleSelectedStudents.indexOf(data.key) > -1;
            }).map(function (user) {
              return {
                "first_name": user.data.profile.name.givenName,
                "last_name": user.data.profile.name.familyName,
                "email": user.data.profile.emailAddress,
                "id": user.data.profile.id
              };
            });
            promises.push(Classes.createGoogleClassStudents($scope.classId, new_students).then(function () {
              $rootScope.$broadcast("student-status-changed");
            }, function (error) {
              $scope.googleServerError = Message.get(error);
              $scope.submitting = false;
              throw error;
            })
            );
          }
          $q.all(promises).then(function () {
            if ($scope.create) {
              Classes.load().finally(function () {
                $state.go('dashboard.teacherClass', { classId: $scope.classId, packId: '', courseId: '' });
              })
            }
          })
          return waitForRosterSave.promise
        };

        async function getUpdatedTeamOrClassDetails () {
          $scope.isTeam ? await getTeamDetails() : await getClassDetails()
        }

        async function reloadLeaguesOrCourses () {
          $scope.loading = true
          $scope.isTeam ? await $scope.loadLeagues() : await $scope.loadCourses()
          $scope.loading = false
          $scope.shouldReloadCourses = false
        }

        async function waitForInitialize () {
          if ($scope.isInitialized) {
            $scope.loading = false
            return true
          }

          $scope.loading = true

          return new Promise((resolve) => {
            const interval = setInterval(() => {
              if ($scope.isInitialized) {
                $scope.loading = false
                clearInterval(interval)
                resolve(true)
              }
            }, 100)
          })
        }

        async function handleDialogInitialization() {
          $scope.loading = true
          $scope.isInitialized = false
          await getSchoolsListIntoForm()

          if (!$scope.create) {
            $scope.shouldReloadCourses = true
            $scope.gotoStep(openStep > -1 ? openStep : CLASS_DIALOG_CONFIG.edit.steps[0].index, true)
            await getUpdatedTeamOrClassDetails()

            if ($scope.currentStep === 1) isRosterAllowed()
            
          } else if ($scope.currentStep === 0) isRosterAllowed()
          $scope.loading = false
          $scope.isInitialized = true
        }

        await handleDialogInitialization()
        saveOriginalUserDataState()
      }

      wrapController()
    }).value('classId', -1).value('parentObj', -1).value('classroom', -1).value('isNew', -1).value('openStep', -1).value('hasStudents', false).value('league', null);
  })
