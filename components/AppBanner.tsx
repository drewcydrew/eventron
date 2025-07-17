import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Image,
  Modal,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AppBannerProps {
  appName: string;
  appIcon?: any;
  privacyPolicyUrl: string;
  androidUrl: string;
  androidTestersGroupUrl: string;
  iosUrl: string;
}

const AppBanner = ({
  appName = "Double Bill",
  appIcon,
  privacyPolicyUrl,
  androidUrl,
  androidTestersGroupUrl,
  iosUrl,
}: AppBannerProps) => {
  const colorScheme = useColorScheme();
  const [isSessionDismissed, setIsSessionDismissed] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  const colors = {
    primary: "#007AFF",
    surface: colorScheme === "dark" ? "#1C1C1E" : "#FFFFFF",
    background: colorScheme === "dark" ? "#000000" : "#F2F2F7",
    border: colorScheme === "dark" ? "#38383A" : "#E5E5EA",
    text: colorScheme === "dark" ? "#FFFFFF" : "#000000",
    textSecondary: colorScheme === "dark" ? "#8E8E93" : "#6D6D70",
  };

  const handleDismiss = () => {
    setIsSessionDismissed(true);
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(privacyPolicyUrl);
  };

  const handleInstallAndroid = () => {
    setShowAndroidModal(true);
  };

  const handleAndroidInstallConfirm = () => {
    setShowAndroidModal(false);
    Linking.openURL(androidUrl);
  };

  const handleJoinBetaGroup = () => {
    setShowAndroidModal(false);
    Linking.openURL(androidTestersGroupUrl);
  };

  const handleInstallIOS = () => {
    Linking.openURL(iosUrl);
  };

  const handleJoinAndroidBeta = () => {
    Linking.openURL(androidTestersGroupUrl);
  };

  // Don't show if session dismissed
  if (isSessionDismissed) {
    return null;
  }

  const renderAppIcon = () => {
    if (appIcon) {
      return (
        <Image source={appIcon} style={styles.appIcon} resizeMode="cover" />
      );
    } else {
      return (
        <View
          style={[
            styles.iconFallback,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="film" size={24} color={colors.primary} />
        </View>
      );
    }
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Header row with icon, content, and close button */}
        <View style={styles.headerRow}>
          {/* App Icon */}
          <View style={styles.iconContainer}>{renderAppIcon()}</View>

          <View style={styles.content}>
            {Platform.OS === "web" ? (
              <>
                <View style={styles.headerSection}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {appName}
                  </Text>
                </View>
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  Download on mobile for best experience.
                </Text>
              </>
            ) : (
              <>
                <View style={styles.headerSection}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={colors.primary}
                    style={styles.headerIcon}
                  />
                  <Text style={[styles.title, { color: colors.text }]}>
                    Welcome to {appName}!
                  </Text>
                </View>
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  Your privacy matters to us. Check out our privacy policy
                  below.
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Full-width button row */}
        {Platform.OS === "web" ? (
          <View style={styles.fullWidthButtonContainer}>
            <TouchableOpacity
              style={[styles.mobileButton, { backgroundColor: colors.primary }]}
              onPress={handleInstallAndroid}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-android"
                size={16}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.mobileButtonText}>Android</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileButton, { backgroundColor: colors.primary }]}
              onPress={handleInstallIOS}
              activeOpacity={0.8}
            >
              <Ionicons
                name="logo-apple"
                size={16}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.mobileButtonText}>iOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mobileSecondaryButton}
              onPress={handleJoinAndroidBeta}
              activeOpacity={0.8}
            >
              <Ionicons
                name="people"
                size={14}
                color="#fff"
                style={styles.buttonIcon}
              />
              <Text style={styles.mobileButtonText}>Beta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileLinkButton, { borderColor: colors.primary }]}
              onPress={handlePrivacyPolicy}
              activeOpacity={0.8}
            >
              <Ionicons
                name="book"
                size={14}
                color={colors.primary}
                style={styles.buttonIcon}
              />
              <Text
                style={[styles.mobileLinkButtonText, { color: colors.primary }]}
              >
                Policy
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fullWidthButtonContainer}>
            <TouchableOpacity
              style={[styles.mobileLinkButton, { borderColor: colors.primary }]}
              onPress={handlePrivacyPolicy}
              activeOpacity={0.8}
            >
              <Ionicons
                name="book"
                size={14}
                color={colors.primary}
                style={styles.buttonIcon}
              />
              <Text
                style={[styles.mobileLinkButtonText, { color: colors.primary }]}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Android Beta Warning Modal */}
      <Modal
        visible={showAndroidModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAndroidModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Ionicons
                name="warning"
                size={24}
                color="#dc3545"
                style={styles.modalIcon}
              />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Android Beta Required
              </Text>
            </View>

            <Text
              style={[styles.modalMessage, { color: colors.textSecondary }]}
            >
              To install the Android app, you must first join our beta testing
              group.
            </Text>

            <Text style={[styles.modalQuestion, { color: colors.text }]}>
              Have you already joined the beta testing group?
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalPrimaryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleAndroidInstallConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.modalPrimaryButtonText}>
                  Yes, Install App
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={handleJoinBetaGroup}
                activeOpacity={0.8}
              >
                <Text style={styles.modalSecondaryButtonText}>
                  No, Join Group Now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={() => setShowAndroidModal(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.modalCancelButtonText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconContainer: {
    padding: 12,
    paddingRight: 8,
  },
  appIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  iconFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingLeft: 8,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  fullWidthButtonContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 4,
  },
  mobileButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mobileSecondaryButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileLinkButton: {
    flex: 1,
    backgroundColor: "transparent",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mobileButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  mobileLinkButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  buttonIcon: {
    marginRight: 6,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    borderWidth: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIcon: {
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalQuestion: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },
  modalButtonContainer: {
    gap: 12,
  },
  modalPrimaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalPrimaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSecondaryButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSecondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancelButton: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default AppBanner;
