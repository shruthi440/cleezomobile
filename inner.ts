import { StyleSheet, Dimensions ,Platform} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Logic to detect tablet for layout adjustments
const isTablet = SCREEN_WIDTH > 768;

// Scale font based on standard iPhone 11/12 width (375px) with a cap for tablets
const scaleFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = isTablet ? size * (scale * 0.8) : size * scale; 
  return Math.round(Platform.OS === 'ios' ? newSize : newSize - 1);
};

const MAIN_LAYOUT_HEIGHT = isTablet ? hp('35%') : hp('45%');
export const globalStyles = StyleSheet.create({
safeArea: { 
    flex: 1, 
    backgroundColor: '#f6f6f7' 
  },
  scrollView: { 
    flex: 1 
  },
  container: { 
    padding: 16,
    marginTop: Platform.OS === 'ios' ? 0 : 10 
  },
  viewLinkBlack: { fontSize: 12, color: '#000', marginTop: 5, textAlign: 'left' },
  cardTitle: { fontSize: scaleFont(13), fontWeight: 'bold', color: '#000' },
  cardTitleBlack: { fontSize: scaleFont(11), fontWeight: 'bold', color: '#000' },
  bigGradeBlack: { fontSize: scaleFont(16), fontWeight: 'bold', textAlign: 'right', marginTop: -5 },
  percentTextBlack: { fontSize: scaleFont(11), color: '#000', textAlign: 'right' },
  viewLinkBlue: { fontSize: 11, color: '#0a3d62', fontWeight: '600' },
  barRow: {
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: 6,               // space between running & lagging
},extraButtonRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 5,
  paddingHorizontal: 10,
},
extraButtonRow1: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 15,
  paddingHorizontal: 1,
},
  iconImage: { width: 40, height: 40, resizeMode: 'contain' },
  table: {
    borderWidth: 1,
    borderColor: '#000',
  },
  header: {
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  row1: {
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  cell1: {
    borderRightWidth: 1,
    borderColor: '#000',
    paddingVertical: 6,
  },  headerText1: {
    fontSize: 10,
    fontWeight: '600',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  btn: {
    backgroundColor: '#ddd',
    padding: 12,
    marginVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  footerWrapper: {
    position: 'absolute',
    bottom: hp('0.5%'), // Pinned to absolute bottom
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
    footerWrapper1: {
   position: 'absolute',
    bottom: hp('-1%'), // 1% from the very bottom of the screen
    left: 0,
    right: 0,
    alignItems: 'center', // Centers children horizontally
    justifyContent: 'center',
    zIndex: 99, // Ensures it stays above all other content
  },
 footerWrapper2: {
    position: 'absolute',
    bottom: hp('-1%'), // 1% from the very bottom of the screen
    left: 0,
    right: 0,
    alignItems: 'center', // Centers children horizontally
    justifyContent: 'center',
    zIndex: 99, // Ensures it stays above all other content
  },
smallCard: {
    backgroundColor: '#FFFFFF',
    // Use wp for border radius so corners stay proportional to screen width
    borderRadius: wp('5%'), 
    // Responsive padding ensures text isn't cramped on small screens
    padding: wp('3.5%'), 
    
    // Use hp for height to ensure it occupies the same vertical space on all devices
    height: hp('12%'), 
    
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#000',
    
    // Android shadow
    elevation: 4,
    
    // iOS shadow (adding this ensures a consistent look across platforms)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overallBg: { backgroundColor: '#FFFFFF' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 10,
  },
footerNotes: {
  paddingHorizontal: 12,
  paddingBottom: 16,
  height:'18%',
  marginBottom:'6%'
},
noteRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    
    // Use hp for vertical spacing so it scales with screen height
    marginBottom: hp('1.0%'), 
    
    // Ensure content doesn't touch the screen edges on narrow phones
    width: '100%',
    paddingHorizontal: wp('1%'),
  },  bullet: { fontSize: 13, flex: 1 },
  blackBtn: { backgroundColor: '#404040', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 15 },
  btnText: { color: '#F2F2F2', fontSize: 11, fontWeight: 'bold' },
  headerText: { fontSize: scaleFont(18), fontWeight: 'bold', color: '#000' },
  syllabusContainer1: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
    
    // Using hp ensures the container always takes up 54% of the 
    // viewable screen height across all device densities.
    height: hp('55%'),
  },
    syllabusContainertwo: { 
    backgroundColor: '#f6f6f7',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f6f6f7',
    
    // Using hp ensures the container always takes up 54% of the 
    // viewable screen height across all device densities.
    height: hp('62%'),
  },
  syllabusContainerCalender: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
    
    // Using hp ensures the container always takes up 54% of the 
    // viewable screen height across all device densities.
    height: hp('66%'),
  },
syllabusContainerCalenders: { 
    backgroundColor: '#f6f6f7',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#f6f6f7',
    overflow: 'hidden',
    paddingBottom: hp('1.2%'),
    
    // Using hp ensures the container always takes up 54% of the 
    // viewable screen height across all device densities.
    height: hp('65%'),
    marginBottom: hp('12%'),
  },
      Media: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
    
    // Using hp ensures the container always takes up 54% of the 
    // viewable screen height across all device densities.
    height: hp('63%'),
  },
  syllabusContent: { flex: 1, padding: '3.92%' },
  modeSelector: { flexDirection: 'row', justifyContent: 'center', marginTop:'-2%' },
modeButton: { 
    // Uses width percentage for horizontal padding and height for vertical
    paddingVertical: hp('1.2%'), 
    paddingHorizontal: wp('0%'),
    
    // Using wp for margin ensures the gap between buttons scales with screen width
    marginHorizontal: wp('1.5%'), 
    
    // Scale border radius so it doesn't look too "sharp" on big screens
    borderRadius: wp('2.5%'), 
    
    borderWidth: 1, 
    borderColor: '#ccc', 
    
    // 45% is good for a 2-column layout, leaving 10% for margins and gaps
    width: isTablet ? wp('30%') : wp('40%'), 
    
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#404040',
     color: '#F2F2F2' 
  },  activeModeButton: { backgroundColor: '#404040', borderColor: '#5A7488' },
  modeButtonText: { color: '#f2f2f2', fontWeight: '600' },
  activeModeButtonText: { color: '#F2F2F2' },
  activeTabBtn: {
  backgroundColor: '#404040', // or your theme color
},

activeTabText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize:14
},
inactiveTabText: {
  fontSize: 14,      // ✅ inactive font size
  color: '#fff',
},
  // Adjusted Notch Container to be Relative
  notchContainerRelative: {
    height: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -15,
    marginBottom: 0,
    opacity: 0,
  },topRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 10,
},
topRow1: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 10,
},
leftButtons: {
  flexDirection: 'row',
  gap: 10,
},

messageLayout: {
  flexDirection: 'row',
  alignItems: 'stretch',   // 👈 makes icon match height of left column
  marginTop: 10,
},
centerIconRow: {
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 14,
},
leftColumn3: {
  flex: 1,
  justifyContent: 'space-between',
},
picker: {
  width: '100%',
  height: 80,

  padding: 0,
  margin: 0,

  color: '#F2F2F2',
},messageBtnTall: {
  width: 60,
  height: 70,          // taller look
  backgroundColor: '#FFFFFF', 
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: 10,
  elevation: 4,
  borderColor:'#F06292',
  borderWidth:2
}
,

  notchContainer4: { 
position: 'absolute',
  left: 0,
  right: 0,
  top: '62%',              // or bottom: 0 if you want at bottom
  transform: [{ translateY: -20 }],
  height: 40,
  zIndex: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  pointerEvents: 'none',
    alignItems: 'center',    // 🔑 centers children vertically

}

,gridContainer: {
  height: '55%',           // ✅ FIXED HEIGHT (adjust as needed)
  borderRadius: 12,
  backgroundColor: '#f6f6f7',
  paddingVertical: '1%',
  marginTop:'15%'
},
gridContainer1: {
  height: 160,           // ✅ FIXED HEIGHT (adjust as needed)
  borderRadius: 12,
  backgroundColor: '#FFFFFF',
  paddingVertical: 10,
},

  gridScrollContent: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  paddingHorizontal: 10,
},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',    
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },  combinedSection: { 
    padding: SCREEN_WIDTH * 0.035,
    flex: 1,
    justifyContent: 'center'
  },
  bigGrade: { fontSize: 28, fontWeight: 'bold', textAlign: 'right', marginTop:25 },
  attendanceBorder: { borderWidth: 2, borderColor: '#000' },  // Updated

  // Typography


  viewLinkCenter: { fontSize: 12, color: '#000', marginTop: 5, textAlign: 'center' },
  tabText: { fontSize: 16, color: '#aaa', fontWeight: 'bold' },
  viewLink2: { fontSize: 12, color: '#000',  marginTop: 5, textAlign: 'center' },
  percentText: { fontSize: 11, color: '#000', textAlign: 'right',marginTop:-5 },
  viewLink1: { fontSize: 12, color: '#0a3d62',  marginTop: 5, textAlign: 'left' },
  viewLink: { fontSize: 12, color: '#000',  marginTop: 5, textAlign: 'left' },

selectBtnText: {
  fontWeight: '600',
  color: '#000',
  fontSize:14
},

  mainLayout: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 15,
    width: '100%',
  },
  leftColumn: { 
    flex: 0.4, // Takes 40% of the horizontal space
    marginRight: 10 
  },
  rightColumn: {
    flex: 0.5, // Takes 60% of the horizontal space
  },

notchContainer: { 
  position: 'absolute',     // ✅ KEY CHANGE
  top: '50%',               // ✅ vertical center of card
  left: 0,
  right: 0,

  transform: [{ translateY: -20 }], // half of height (40 / 2)

  height: 40,
  width: '100%',
 marginHorizontal: -0.5, 
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',

  backgroundColor: '#FFFFFF',  // hides card border
  zIndex: 10,
},  combinedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#000',
    flex: 0.6, // Takes 40% of the horizontal space
    minHeight: SCREEN_HEIGHT * 0.26,
    position: 'relative',
  },

submitBtnText: {
  color: '#F2F2F2',
  fontWeight: '600',
},

  bigNum: { fontSize: scaleFont(30), fontWeight: 'bold', textAlign: 'right', marginTop: -10 },
 
  viewLinkBlue3: { fontSize: 11, color: '#0a3d62', marginTop: 0 },
  viewLinkBlue1: { fontSize: 12, color: '#0a3d62', marginTop: 20, textAlign: 'left' },
  viewLinkBlack1: { fontSize: 12, color: '#000', marginTop: 20, textAlign: 'left' },
notchContainer3: {
  position: 'absolute',
  left: 0,
  right: 0,
  top: '16%',              // or bottom: 0 if you want at bottom
  transform: [{ translateY: -20 }],
  height: 40,
  zIndex: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  pointerEvents: 'none',
    alignItems: 'center',    // 🔑 centers children vertically

},
classDropdownWrapper: {
  marginTop: 8,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
},

leftNotch: {
  width: 22,
  height: 40,
  backgroundColor: '#FFFFFF',

  borderTopRightRadius: 25,
  borderBottomRightRadius: 25,

  // ONLY curve outline
  borderTopWidth: 2,
  borderBottomWidth: 2,
  borderRightWidth: 2,
  borderColor: '#000',

  position: 'absolute',
  left: -3,
  zIndex: 3,
},
rightNotch: {
  width: 22,
  height: 40,
  backgroundColor: '#FFFFFF',

  borderTopLeftRadius: 25,
  borderBottomLeftRadius: 25,

  borderTopWidth: 2,
  borderBottomWidth: 2,
  borderLeftWidth: 2,
  borderColor: '#000',

  position: 'absolute',
  right: -3,
  zIndex: 3,
},

  dashedLine: { 
    flex: 1, 
    borderBottomWidth: 1.5, 
    borderColor: '#000', 
    borderStyle: 'dashed', 
  },

  inputContainer: { alignItems: 'center', marginTop: 10 },
  selectionContainer: { width: '100%', alignItems: 'center', marginBottom: 20 },
  inputSelecterWrapper: {
    borderRadius: 15, paddingHorizontal: 10, marginVertical: 8,
  backgroundColor: '#FFFFFF', elevation: 3, width: wp('75%'), height: 50, justifyContent: 'center',
    borderWidth: 1, borderColor: '#eee'
  },
  submitButton: { backgroundColor: '#5A7488', padding: 12, borderRadius: 8, marginTop: 10, width: wp('75%'), alignItems: 'center' },
  buttonText: { color: '#F2F2F2', fontSize: 16, fontWeight: 'bold' },
  approvedDay: {
  borderColor: '#4caf50', // green
  borderRadius: 6,
  borderWidth:2
},
rejectedDay: {
  backgroundColor: '#f44336', // red
  borderRadius: 6,
},
pendingDay: {
  backgroundColor: '#ff9800', // orange
  borderRadius: 6,
},
reasonModal: {
  width: '85%',
  backgroundColor: '#FFFFFF',
  borderRadius: 10,
  padding: 20,
},

modalTitle: {
  fontSize: 16,
  fontWeight: '600',
  marginBottom: 10,
},

reasonInput: {
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 6,
  padding: 10,
  minHeight: 80,
  textAlignVertical: 'top',
},

modalBtnRow: {
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: 15,
},

cancelBtn: {
  paddingVertical: 8,
  paddingHorizontal: 15,
  marginRight: 10,
  backgroundColor: '#aaa',
  borderRadius: 6,
},

saveBtn: {
  paddingVertical: 8,
  paddingHorizontal: 15,
  backgroundColor: '#4CAF50',
  borderRadius: 6,
},



  // Table Styling
  headerRowTable: { backgroundColor: '#5A7488' },
  headerTextTable: { color: '#F2F2F2', fontWeight: '100' },
  tableHeader: { width: wp('35%'), justifyContent: 'center' },
  timeText: { color: '#F2F2F2', fontSize: 8 },
  row: { borderBottomWidth: 1, borderColor: '#ddd' },
  cell: { width: wp('35%'), height: hp('8%'), justifyContent: 'center', borderRightWidth: 1, borderColor: '#eee' },
  subjectText: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  breakText: { fontStyle: 'italic', color: 'orange', fontSize: 11, textAlign: 'center' },
  emptyCell: { color: '#ccc', textAlign: 'center' },
  text: { fontSize: 12, textAlign: 'center' },
  
  teacherTableHeader: { backgroundColor: '#5A7488', height:'16%',fontSize:10 },
  teacherHeaderCell: { width: 80, color: '#F2F2F2', fontWeight: 'bold',fontSize:10, padding: 8, textAlign: 'center', borderRightWidth: 1 },
  teacherHeaderCellSmall: { width: 60, color: '#F2F2F2',fontSize:10, fontWeight: 'bold', padding: 8, textAlign: 'center', borderRightWidth: 1 },
  teacherHeaderCellMed: { width: 70, color: '#F2F2F2',fontSize:10, fontWeight: 'bold', padding: 8, textAlign: 'center', borderRightWidth: 1 },
  teacherDataCellDay: { width: 80,fontSize:10, padding: 8, textAlign: 'center', borderRightWidth: 1, fontWeight: 'bold', color: '#5A7488' },
  teacherDataCell: { width: 70,fontSize:10, color: '#000',  padding: 8, textAlign: 'center', borderRightWidth: 1 },
  textContainer: { padding: 20 },
  infoText: { fontSize: 12, textAlign: 'center', color: '#7f8c8d', fontStyle: 'italic' },
  scrollViewVertical: {},
   calendarmonth:{
        color:'black',
      },
    calendarTitle: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
        marginTop:20,
        color:'black',


    },
monthDropdownWrapper: {
  marginHorizontal: 15,
  marginTop: 10,
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  overflow: 'hidden',
},

monthPicker: {
  height: 50,
  width: '100%',
  color:'#111827'
},


extraBtn: {
  flex: 1,
  marginHorizontal: 5,
  paddingVertical: 12,
  backgroundColor: '#F3F4F6',
  borderRadius: 999,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  alignItems: 'center',
},

extraBtnText: {
  color: '#111827',
  fontSize: 14,
  fontWeight: '600',
},
selectBtn1: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 999,
  paddingVertical: 6,
  paddingHorizontal: 30,
  width: '45%',
  alignItems: 'center',
  marginRight: 5,            // ⬅️ gap between buttons
},
submitBtn1: {
  backgroundColor: '#111827',
  borderRadius: 999,
  paddingVertical: 12,
  paddingHorizontal: 30,
  width: '45%',
  alignItems: 'center',
  marginLeft: 10,             // ⬅️ gap between buttons
},
submitBtn3: {
  backgroundColor: '#404040',
  borderRadius: 15,
  paddingVertical: 12,
  paddingHorizontal: 30,
  width: '45%',
  alignItems: 'center',
  marginLeft: 10,             // ⬅️ gap between buttons
},
  buttonRow1: {
  flexDirection: 'row',
  justifyContent: 'center',   // ⬅️ center group
  alignItems: 'center',  marginTop: '2%',
    paddingHorizontal: 15,      // ⬅️ left & right gap

},

navBtn: {
  width: 20,
  height: 20,
  borderRadius: 4,
  alignItems: 'center',
  justifyContent: 'center',
},

calendarContainer: { marginTop: 0 },
    monthNavigation: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingHorizontal: 8,
      paddingVertical: 10,
      backgroundColor: '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    monthTitle: {
      fontSize: 20,
      color: '#111827',
      fontWeight: '900',
    },
    month: {
      marginVertical: 10,
      color: 'black',
      paddingBottom: 4,
    },
    weekdays: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: '#F4F1EA',
      color: 'black',
      paddingVertical: 8,
      paddingHorizontal: 6,
      borderRadius: 14,
      marginBottom: 8,
    },
    weekday: {
      width: '14%',
      color: '#6B7280',
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 12,
    },
    days: {
      flexDirection: 'row',
      color: 'black',
      flexWrap: 'wrap',
      paddingHorizontal: 2,
    },
    day: {
        width: '14%',
        paddingVertical: 10,
        paddingHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        color: 'black',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 6,
    },
    emptyDay: {
        width: '14%',
        height: 52,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    dayText: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '700',
    },
    eventDay: {
        backgroundColor: '#d0e7f3',
    },
    monthToggleRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginVertical: 10,
},
dropdownWrapper: {
  flexDirection: 'row',
  justifyContent: 'flex-end', // ⬅️ push to right
  paddingHorizontal: 10,
  marginBottom: 8,
},

  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    height: hp('4.5%'),
    width: wp('34%'),
    justifyContent: 'center',
  },

monthToggleBtn: {
  paddingVertical: 6,
  paddingHorizontal: 16,
  marginHorizontal: 5,
  borderRadius: 20,
  backgroundColor: '#eee',
},

monthActive: {
  backgroundColor: '#404040',
},

monthToggleText: {
  fontSize: 14,
  color: '#333',
},

monthActiveText: {
  color: '#FFFFFF',
  fontWeight: '600',
},

topSwitchRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 10,
},

switchBtn: {
  flex: 1,
  paddingVertical: 8,
  marginHorizontal: 3,
  paddingHorizontal: 8,
  borderRadius: 999,
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  minHeight: 42,
},

switchActive: {
  backgroundColor: '#111827',
  borderColor: '#111827',
},

switchText: {
  color: '#6B7280',
  fontSize: 12,
  fontWeight: '700',
  textAlign: 'center',
},

switchActiveText: {
  color: '#FFFFFF',
  fontWeight: '600',
},

classSectionContainer: {
  padding: 18,
  alignItems: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  minHeight: 160,
},

classSectionText: {
  fontSize: 15,
  color: '#6B7280',
  fontWeight: '600',
},
 eventDaySelected: {
        borderColor: '#111827',
        borderWidth: 2,
    },
    today: {
        backgroundColor: '#FFF7E6',
        borderColor: '#D97706',
        borderWidth: 1,
    },
    todayText: {
        fontWeight: 'bold',
        color: '#D97706',
    },
    modalOverlay: { flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
         backgroundColor: 'rgba(0, 0, 0, 0.5)',
         },
    modalContent: { width: '88%',
         padding: 20,
          backgroundColor: 'white',
          borderRadius: 16,
           alignItems: 'center',
         },
    modalText: { fontSize: 18,
         fontWeight: 'bold',
          marginBottom: 20,
          color:'black'
         },
    button: {
        backgroundColor: '#111827',
        padding: hp('2%'),
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: hp('1%'),
        width: '100%',
      },
 
});
